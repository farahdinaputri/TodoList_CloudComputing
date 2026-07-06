# To-Do List REST API

Aplikasi REST API sederhana untuk mengelola daftar tugas (to-do list), dibuat menggunakan Python (Flask). Proyek ini dibuat untuk Tugas Praktikum Terintegrasi: Integrasi Docker, Container Orchestration, dan CI/CD.

## Struktur Proyek

```
todo-api/
├── source-code/
│   ├── app.py
│   └── requirements.txt
├── tests/
│   └── test_app.py
├── Dockerfile
├── docker-compose.yml
├── README.md
└── .github/
    └── workflows/
        └── ci.yml
```

## Endpoint API

| Method | Endpoint          | Deskripsi                     |
|--------|-------------------|--------------------------------|
| GET    | /health            | Cek status aplikasi           |
| GET    | /todos             | Menampilkan seluruh todo      |
| POST   | /todos             | Menambahkan todo baru         |
| GET    | /todos/<id>        | Menampilkan detail satu todo  |
| PUT    | /todos/<id>        | Memperbarui todo              |
| DELETE | /todos/<id>        | Menghapus todo                |

## Menjalankan Secara Lokal (tanpa Docker)

```bash
cd source-code
pip install -r requirements.txt
python app.py
```

Aplikasi dapat diakses di `http://localhost:5000`.

## Menjalankan Automated Test

```bash
pip install -r source-code/requirements.txt
pytest tests/ -v
```

## Menjalankan dengan Docker

```bash
docker build -t todo-api:v1 .
docker run -d --name todo-api -p 8080:5000 todo-api:v1
```

Aplikasi dapat diakses di `http://localhost:8080`.

## Menjalankan dengan Docker Compose

```bash
docker compose up -d
docker compose ps
docker compose down
```

## Contoh Penggunaan (curl)

```bash
# Cek health
curl http://localhost:8080/health

# Tambah todo
curl -X POST http://localhost:8080/todos -H "Content-Type: application/json" -d '{"title": "Belajar Docker"}'

# Lihat semua todo
curl http://localhost:8080/todos
```

## CI/CD

Pipeline GitHub Actions (`.github/workflows/ci.yml`) otomatis menjalankan:
1. Checkout kode
2. Instalasi dependency
3. Automated testing (pytest)
4. Docker build

Pipeline berjalan setiap kali ada push atau pull request ke branch `main`.
