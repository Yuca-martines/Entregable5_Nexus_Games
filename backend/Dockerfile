# ==============================================================================
# DOCKERFILE - BACKEND NEXUS GAMES (FastAPI + SQLAlchemy + SQLite)
# ==============================================================================

FROM python:3.11-slim

# Evitar que Python escriba archivos .pyc y habilitar logs en tiempo real
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Puerto por defecto (Railway lo sobreescribe con su propio $PORT)
ENV PORT=8000

# Directorio de trabajo en el contenedor
WORKDIR /app

# Instalar solo las dependencias del sistema estrictamente necesarias
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependencias de Python primero (capa cacheada)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copiar el resto del código del backend
COPY . .

# Crear carpeta de base de datos con permisos correctos
RUN mkdir -p /app/database && chmod 777 /app/database

# Exponer el puerto por defecto
EXPOSE 8000

# Healthcheck para que Railway detecte cuando el servicio está listo
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/api/health || exit 1

# Comando de inicio usando exec form con shell para expansión de variables
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]
