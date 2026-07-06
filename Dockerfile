# Base image resmi Python versi ringan
FROM python:3.12-slim

# Menetapkan working directory di dalam container
WORKDIR /app

# Menyalin file requirements terlebih dahulu (memanfaatkan Docker layer cache)
COPY source-code/requirements.txt .

# Instalasi dependency
RUN pip install --no-cache-dir -r requirements.txt

# Menyalin seluruh source code aplikasi
COPY source-code/ .

# Port yang digunakan aplikasi Flask
EXPOSE 5000

# Perintah untuk menjalankan aplikasi
CMD ["python", "app.py"]
