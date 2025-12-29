# Dockerfile pro Django backend
FROM python:3.12-slim

# Nastavení prostředí
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Pracovní adresář
WORKDIR /app

# Instalace systémových závislostí
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Kopírování requirements a instalace Python závislostí
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kopírování zdrojového kódu
COPY . .

# Vytvoření adresáře pro média
RUN mkdir -p /app/media

# Exponování portu
EXPOSE 8000

# Spuštění serveru
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
