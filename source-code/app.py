"""
Aplikasi To-Do List REST API sederhana menggunakan Flask.
Dibuat untuk Tugas Praktikum Integrasi Docker, Orkestrasi, dan CI/CD.
"""
import json
import os

from flask import Flask, jsonify, request, render_template

app = Flask(__name__)

# Penyimpanan sementara di memori (in-memory storage)
todos = []
next_id = 1
todo_file = os.path.join(os.path.dirname(__file__), "todos.json")


def load_todos_from_disk():
    global todos, next_id
    if not os.path.exists(todo_file):
        return
    try:
        with open(todo_file, "r", encoding="utf-8") as f:
            saved = json.load(f)
        if isinstance(saved, list):
            todos = saved
            next_id = max((t.get("id", 0) for t in todos), default=0) + 1
    except (json.JSONDecodeError, OSError):
        todos = []
        next_id = 1


def persist_todos_to_disk():
    if app.config.get("TESTING"):
        return
    try:
        with open(todo_file, "w", encoding="utf-8") as f:
            json.dump(todos, f, ensure_ascii=False, indent=2)
    except OSError:
        pass


load_todos_from_disk()


@app.route("/health", methods=["GET"])
def health_check():
    """Endpoint health check untuk memverifikasi aplikasi berjalan."""
    return jsonify({"status": "healthy"}), 200


@app.route("/todos", methods=["GET"])
def get_todos():
    """Mengambil seluruh daftar todo."""
    return jsonify(todos), 200


@app.route("/todos", methods=["POST"])
def create_todo():
    """Menambahkan todo baru."""
    global next_id
    data = request.get_json(silent=True)

    if not data or "title" not in data or not str(data["title"]).strip():
        return jsonify({"error": "Field 'title' wajib diisi"}), 400

    todo = {
        "id": next_id,
        "title": data["title"],
        "done": False,
    }
    todos.append(todo)
    next_id += 1
    persist_todos_to_disk()
    return jsonify(todo), 201


@app.route("/todos/<int:todo_id>", methods=["GET"])
def get_todo(todo_id):
    """Mengambil satu todo berdasarkan id."""
    todo = next((t for t in todos if t["id"] == todo_id), None)
    if todo is None:
        return jsonify({"error": "Todo tidak ditemukan"}), 404
    return jsonify(todo), 200


@app.route("/todos/<int:todo_id>", methods=["PUT"])
def update_todo(todo_id):
    """Memperbarui todo (misalnya menandai selesai)."""
    todo = next((t for t in todos if t["id"] == todo_id), None)
    if todo is None:
        return jsonify({"error": "Todo tidak ditemukan"}), 404

    data = request.get_json(silent=True) or {}
    if "title" in data:
        todo["title"] = data["title"]
    if "done" in data:
        todo["done"] = bool(data["done"])
    persist_todos_to_disk()
    return jsonify(todo), 200


@app.route("/todos/<int:todo_id>", methods=["DELETE"])
def delete_todo(todo_id):
    """Menghapus todo berdasarkan id."""
    global todos
    todo = next((t for t in todos if t["id"] == todo_id), None)
    if todo is None:
        return jsonify({"error": "Todo tidak ditemukan"}), 404

    todos = [t for t in todos if t["id"] != todo_id]
    persist_todos_to_disk()
    return jsonify({"message": "Todo berhasil dihapus"}), 200


@app.route("/", methods=["GET"])
def index():
    """Menampilkan halaman web sederhana untuk mengelola todo."""
    return render_template("index.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
