// Frontend for To-Do Dashboard
// Responsibilities:
// - call backend API /todos for CRUD
// - store extra metadata (description, priority, status, due) in localStorage
// - render table, stats, and Chart.js doughnut

const TODO_API = "/todos";

// helpers for localStorage meta
function loadMeta() {
  try {
    return JSON.parse(localStorage.getItem("todo_meta") || "{}");
  } catch (e) {
    return {};
  }
}
function saveMeta(meta) {
  localStorage.setItem("todo_meta", JSON.stringify(meta));
}
function getMeta(meta, id) {
  return (
    meta[id] || { description: "", priority: "Low", status: "Pending", due: "" }
  );
}

let meta = loadMeta();
let todos = [];
let chart = null;

const SAMPLE_TASKS = [
  {
    title: "Finalize project proposal",
    description: "Complete scope, timeline, and budget for stakeholder review.",
    priority: "High",
    status: "In Progress",
    due: "2026-07-15",
  },
  {
    title: "Design landing page UI",
    description: "Create the final layout, color scheme, and content sections.",
    priority: "Medium",
    status: "Pending",
    due: "2026-07-18",
  },
  {
    title: "Review sprint tasks",
    description:
      "Check current sprint progress and prepare daily standup notes.",
    priority: "Low",
    status: "Pending",
    due: "2026-07-20",
  },
  {
    title: "Publish release notes",
    description: "Summarize feature updates and bug fixes for the new release.",
    priority: "Medium",
    status: "Completed",
    due: "2026-07-08",
  },
  {
    title: "Schedule client follow-up",
    description: "Book meeting time and collect feedback from the latest demo.",
    priority: "High",
    status: "In Progress",
    due: "2026-07-12",
  },
];

async function seedSampleTodos() {
  if (localStorage.getItem("todo_seeded") || todos.length > 0) {
    return;
  }
  const newMeta = { ...meta };
  for (const sample of SAMPLE_TASKS) {
    const res = await fetch(TODO_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: sample.title }),
    });
    if (!res.ok) {
      continue;
    }
    const data = await res.json();
    newMeta[data.id] = {
      description: sample.description,
      priority: sample.priority,
      status: sample.status,
      due: sample.due,
    };
  }
  meta = newMeta;
  saveMeta(meta);
  localStorage.setItem("todo_seeded", "1");
  await fetchTodos();
}

const tbody = document.getElementById("todo-table-body");
const search = document.getElementById("search");
const statTotal = document.getElementById("stat-total");
const statCompleted = document.getElementById("stat-completed");
const statInprogress = document.getElementById("stat-inprogress");
const statPending = document.getElementById("stat-pending");
const chartCtx = document.getElementById("chart-status");

async function fetchTodos() {
  const r = await fetch(TODO_API);
  todos = await r.json();
  renderAll();
}

function renderAll() {
  renderStats();
  renderTable();
  renderChart();
}

function renderStats() {
  const total = todos.length;
  const completed = todos.filter((t) => t.done).length;
  let inprog = 0,
    pend = 0;
  todos.forEach((t) => {
    const m = getMeta(meta, t.id);
    if (t.done) return;
    if (m.status === "In Progress") inprog++;
    else pend++;
  });
  statTotal.textContent = total;
  statCompleted.textContent = completed;
  statInprogress.textContent = inprog;
  statPending.textContent = pend;
  document.getElementById("quick-total").textContent = total;
  document.getElementById("quick-completed").textContent = completed;
}

function priorityBadge(p) {
  if (p === "High") return '<span class="badge badge-high">High</span>';
  if (p === "Medium") return '<span class="badge badge-medium">Medium</span>';
  return '<span class="badge badge-low">Low</span>';
}
function statusBadge(todo, m) {
  if (todo.done) return '<span class="badge bg-success">Completed</span>';
  if (m.status === "In Progress")
    return '<span class="badge bg-warning text-dark">In Progress</span>';
  return '<span class="badge bg-secondary">Pending</span>';
}

function escapeHtml(s) {
  return (s || "").toString().replace(/[&<>\"']/g, function (c) {
    return (
      {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '\\"': "&quot;",
        '\"': "&quot;",
        "'": "&#39;",
      }[c] || c
    );
  });
}

function renderTable() {
  const q = ((search && search.value) || "").toLowerCase();
  const rows = todos
    .filter((t) => t.title.toLowerCase().includes(q))
    .map((t, idx) => {
      const m = getMeta(meta, t.id);
      return `<tr>
      <td class="text-center">${idx + 1}</td>
      <td>${escapeHtml(t.title)}<div class="text-muted small">${escapeHtml(m.description || "")}</div></td>
      <td>${priorityBadge(m.priority)}</td>
      <td>${statusBadge(t, m)}</td>
      <td>${escapeHtml(m.due || "")}</td>
      <td>
        <button class="btn btn-sm btn-outline-light me-1" data-action="edit" data-id="${t.id}"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-danger" data-action="delete" data-id="${t.id}"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`;
    })
    .join("");
  tbody.innerHTML =
    rows ||
    '<tr><td colspan="6" class="text-center text-muted">No tasks</td></tr>';
  attachActions();
}

function attachActions() {
  document
    .querySelectorAll('[data-action="edit"]')
    .forEach((b) => b.addEventListener("click", onEdit));
  document
    .querySelectorAll('[data-action="delete"]')
    .forEach((b) => b.addEventListener("click", onDelete));
}

function onEdit(e) {
  const id = e.currentTarget.dataset.id;
  const t = todos.find((x) => x.id == id);
  const m = getMeta(meta, id);
  document.getElementById("edit-id").value = id;
  document.getElementById("edit-title").value = t.title;
  document.getElementById("edit-desc").value = m.description;
  document.getElementById("edit-priority").value = m.priority;
  document.getElementById("edit-status").value = m.status;
  document.getElementById("edit-due").value = m.due;
  const modal = new bootstrap.Modal(document.getElementById("modalEdit"));
  modal.show();
}

async function onDelete(e) {
  const id = e.currentTarget.dataset.id;
  if (!confirm("Delete task?")) return;
  const r = await fetch(`${TODO_API}/${id}`, { method: "DELETE" });
  if (r.ok) {
    delete meta[id];
    saveMeta(meta);
    fetchTodos();
  }
}

// Add form
const formAdd = document.getElementById("form-add");
if (formAdd) {
  formAdd.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const fd = new FormData(formAdd);
    const title = fd.get("title").trim();
    if (!title) return alert("Title required");
    const payload = { title };
    const res = await fetch(TODO_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return alert("Create failed");
    const data = await res.json();
    meta[data.id] = {
      description: fd.get("description") || "",
      priority: fd.get("priority") || "Low",
      status: fd.get("status") || "Pending",
      due: fd.get("due") || "",
    };
    saveMeta(meta);
    bootstrap.Modal.getInstance(document.getElementById("modalAdd")).hide();
    formAdd.reset();
    fetchTodos();
  });
}

// Edit form
const formEdit = document.getElementById("form-edit");
if (formEdit) {
  formEdit.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const fd = new FormData(formEdit);
    const id = fd.get("id");
    const title = fd.get("title").trim();
    if (!title) return alert("Title required");
    await fetch(`${TODO_API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, done: fd.get("status") === "Completed" }),
    });
    meta[id] = {
      description: fd.get("description") || "",
      priority: fd.get("priority") || "Low",
      status: fd.get("status") || "Pending",
      due: fd.get("due") || "",
    };
    saveMeta(meta);
    bootstrap.Modal.getInstance(document.getElementById("modalEdit")).hide();
    fetchTodos();
  });
}

// search and refresh
const searchEl = document.getElementById("search");
if (searchEl) searchEl.addEventListener("input", renderTable);
const btnRefresh = document.getElementById("btn-refresh");
if (btnRefresh) btnRefresh.addEventListener("click", fetchTodos);

// Chart
function renderChart() {
  if (!chartCtx) return;
  const counts = { Completed: 0, "In Progress": 0, Pending: 0 };
  todos.forEach((t) => {
    const m = getMeta(meta, t.id);
    if (t.done) counts.Completed++;
    else if (m.status === "In Progress") counts["In Progress"]++;
    else counts.Pending++;
  });
  const data = [counts.Completed, counts["In Progress"], counts.Pending];
  if (chart) {
    chart.data.datasets[0].data = data;
    chart.update();
    return;
  }
  chart = new Chart(chartCtx, {
    type: "doughnut",
    data: {
      labels: ["Completed", "In Progress", "Pending"],
      datasets: [{ data, backgroundColor: ["#22c55e", "#f59e0b", "#6b7280"] }],
    },
    options: { plugins: { legend: { position: "bottom" } } },
  });
}

// initialize
fetchTodos().then(() => seedSampleTodos());
renderChart();
