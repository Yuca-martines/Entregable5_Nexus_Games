# ==============================================================================
# DOCKERFILE - BACKEND NEXUS GAMES (FastAPI + SQLAlchemy + SQLite / MySQL)
# ==============================================================================

FROM python:3.11-slim

# Evitar que Python escriba archivos .pyc y habilitar logs en tiempo real
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Directorio de trabajo en el contenedor
WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copiar el resto del código del backend
COPY . .

# Crear carpeta de base de datos si no existe y dar permisos
RUN mkdir -p database

# Exponer el puerto por defecto (Railway inyecta la variable $PORT en runtime)
EXPOSE 8000

# Comando de inicio compatible con Railway, Render y Docker local
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
