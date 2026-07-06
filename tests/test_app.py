"""
Automated test sederhana untuk To-Do List REST API.
Menguji endpoint utama sebagai quality gate pipeline CI/CD.
"""
import sys
import os

# Menambahkan folder source-code ke path agar app.py bisa diimport
sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "source-code")
)

import pytest
from app import app, todos


@pytest.fixture
def client():
    """Fixture Flask test client, mereset data sebelum setiap test."""
    app.config["TESTING"] = True
    todos.clear()
    with app.test_client() as client:
        yield client


def test_health_check(client):
    """Endpoint /health harus mengembalikan status healthy."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.get_json()["status"] == "healthy"


def test_get_todos_empty(client):
    """Daftar todo awal harus kosong."""
    response = client.get("/todos")
    assert response.status_code == 200
    assert response.get_json() == []


def test_create_todo(client):
    """Menambahkan todo baru harus berhasil dengan status 201."""
    response = client.post("/todos", json={"title": "Belajar Docker"})
    assert response.status_code == 201
    data = response.get_json()
    assert data["title"] == "Belajar Docker"
    assert data["done"] is False


def test_create_todo_without_title(client):
    """Menambahkan todo tanpa title harus gagal dengan status 400."""
    response = client.post("/todos", json={})
    assert response.status_code == 400


def test_update_todo(client):
    """Memperbarui status todo menjadi selesai."""
    create_res = client.post("/todos", json={"title": "Deploy aplikasi"})
    todo_id = create_res.get_json()["id"]

    update_res = client.put(f"/todos/{todo_id}", json={"done": True})
    assert update_res.status_code == 200
    assert update_res.get_json()["done"] is True


def test_delete_todo(client):
    """Menghapus todo yang sudah ada."""
    create_res = client.post("/todos", json={"title": "Hapus saya"})
    todo_id = create_res.get_json()["id"]

    delete_res = client.delete(f"/todos/{todo_id}")
    assert delete_res.status_code == 200

    get_res = client.get(f"/todos/{todo_id}")
    assert get_res.status_code == 404


def test_get_nonexistent_todo(client):
    """Mengambil todo yang tidak ada harus mengembalikan 404."""
    response = client.get("/todos/999")
    assert response.status_code == 404


def test_index_page(client):
    """Halaman root harus tersedia dan menampilkan HTML aplikasi."""
    response = client.get("/")
    assert response.status_code == 200
    assert b"To-Do List" in response.data
