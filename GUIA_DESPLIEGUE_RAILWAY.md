# 🚀 GUÍA PASO A PASO: DESPLIEGUE DE NEXUS GAMES EN RAILWAY CON DOCKER
### Despliegue Automatizado con Dockerfile para Backend (FastAPI + SQL) y Frontend (React + Vite + Nginx)

Esta guía detalla el proceso exacto para desplegar el proyecto **Nexus Games** en **Railway** ([railway.com](https://railway.com)) utilizando los **Dockerfiles** optimizados que hemos configurado para el backend y el frontend.

---

## 🐳 Archivos Docker Creados en el Proyecto

1. **`backend/Dockerfile`**: Configura un contenedor Python 3.11 Slim con Uvicorn, dependencias y soporte dinámico para la variable `$PORT` inyectada por Railway.
2. **`backend/.dockerignore`**: Optimiza el peso de la imagen excluyendo entornos virtuales, cachés y temporales.
3. **`Dockerfile` (Frontend en raíz)**: Construcción multi-etapa con Node.js 20 Alpine y servidor web **Nginx Alpine** ultraliviano con soporte para SPA (React Router).
4. **`nginx.conf.template`**: Plantilla de Nginx que enlaza automáticamente el puerto `$PORT` de Railway y evita errores 404 al recargar páginas internas.
5. **`.dockerignore`**: Excluye `node_modules` y `dist` de la compilación.
6. **`docker-compose.yml`**: Para levantar y probar todo el stack localmente con `docker compose up --build`.

---

## 🛠️ PASO 1: Iniciar Sesión en Railway

1. Ingresa a [https://railway.com](https://railway.com).
2. Inicia sesión con tu cuenta de **GitHub**.
3. Asegúrate de tener tu repositorio: `https://github.com/Yuca-martines/Entregable5_Nexus_Games.git`.

---

## ⚙️ PASO 2: Desplegar el BACKEND (FastAPI con Dockerfile)

### 2.1. Crear el Servicio
1. En Railway, haz clic en **`+ New Project`**.
2. Selecciona **`Deploy from GitHub repo`**.
3. Selecciona tu repositorio **`Entregable5_Nexus_Games`**.

### 2.2. Configurar la Carpeta del Backend (Root Directory)
1. Haz clic en la tarjeta del servicio recién creado.
2. Ve a la pestaña **`Settings`**.
3. En la sección **`General`** -> **`Root Directory`**, haz clic en **Edit** y escribe:
   ```text
   backend
   ```
4. Guarda los cambios.
> 💡 **Nota:** Railway detectará automáticamente el archivo `backend/Dockerfile` y compilará la imagen de Docker sin necesidad de configurar comandos manuales.

### 2.3. Agregar Variables de Entorno
Ve a la pestaña **`Variables`** del servicio Backend y añade:

| Variable | Valor |
| :--- | :--- |
| `SECRET_KEY` | `NexusGamesSuperSecretKeyJwt2026SecureProductionToken` |
| `ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` |
| `CORS_ORIGINS` | `*` |
| `ENVIRONMENT` | `production` |

### 2.4. Generar Dominio Público
1. En **`Settings`** -> **`Networking`** -> **`Public Networking`**, haz clic en **`Generate Domain`**.
2. Copia la URL generada (ejemplo: `https://backend-production-xxxx.up.railway.app`).

### 2.5. Configurar Volumen Persistente para la Base de Datos SQLite (Recomendado)
Para que los datos de compras, ventas y usuarios no se borren cuando el contenedor se reinicie:
1. En el servicio Backend, ve a la pestaña **`Volumes`**.
2. Haz clic en **`+ Add Volume`**.
3. En **Mount Path**, escribe:
   ```text
   /app/database
   ```
4. Guarda los cambios.

---

## 🎨 PASO 3: Desplegar el FRONTEND (React con Dockerfile & Nginx)

### 3.1. Crear el Servicio del Frontend en el Mismo Proyecto
1. En el mismo proyecto de Railway, haz clic en el botón **`+ Create`** (arriba a la derecha).
2. Selecciona **`GitHub Repo`** -> `Entregable5_Nexus_Games`.
3. Haz clic en la nueva tarjeta creada (puedes renombrarla a `Frontend` en *Settings*).

### 3.2. Configurar Directorio Raíz
1. Ve a **`Settings`** -> **`Root Directory`**.
2. Déjalo como `/` (vacío / raíz). Railway detectará automáticamente el `Dockerfile` de la raíz.

### 3.3. Configurar Variable con la URL del Backend
1. Ve a la pestaña **`Variables`** del Frontend.
2. Agrega la variable con la URL del backend obtenida en el Paso 2.4:

| Variable | Valor |
| :--- | :--- |
| `VITE_API_URL` | `https://tu-backend-production-xxxx.up.railway.app` |

### 3.4. Generar Dominio Público del Frontend
1. En **`Settings`** -> **`Networking`** -> **`Public Networking`**, haz clic en **`Generate Domain`**.
2. ¡Listo! Ya tienes la URL pública de tu tienda online (ejemplo: `https://frontend-production-xxxx.up.railway.app`).

---

## 💻 (Opcional) ¿Cómo Probar los Contenedores Localmente?

Si tienes **Docker Desktop** instalado en tu computadora y quieres probar los contenedores antes de Railway:

1. Abre tu terminal en la raíz del proyecto.
2. Ejecuta:
   ```bash
   docker compose up --build
   ```
3. Accede a:
   - **Frontend:** `http://localhost:3000`
   - **Backend API:** `http://localhost:8000/docs`
4. Para detener los contenedores:
   ```bash
   docker compose down
   ```

---

## 🔑 Credenciales Oficiales para Pruebas en Vivo

| Rol | Correo Electrónico | Contraseña |
| :--- | :--- | :--- |
| **👑 Administrador** | `admin@nexus.com` | `Admin1234*` |
| **👔 Empleado** | `empleado@nexus.com` | `Empleado1234*` |
| **🛍️ Cliente** | `cliente@nexus.com` | `Cliente1234*` |
