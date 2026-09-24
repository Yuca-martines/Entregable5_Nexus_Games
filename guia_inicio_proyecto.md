# 🚀 Guía Completa para Iniciar el Proyecto Nexus Games
## (Quinto Avance — React + Vite + FastAPI + SQLite + IA)

| Recurso          | URL                               |
|:-----------------|:----------------------------------|
| **Frontend**     | http://localhost:5173             |
| **Swagger UI**   | http://127.0.0.1:8000/docs        |
| **ReDoc**        | http://127.0.0.1:8000/redoc       |
| **Health Check** | http://127.0.0.1:8000/api/health  |

---

## 🏗️ Arquitectura del Proyecto

```
Entregable4/                     <- Raiz del Frontend (React + Vite)
├── src/                         <- Codigo fuente React
│   ├── components/              <- Componentes reutilizables
│   │   ├── ChatbotWidget.jsx    <- Chatbot flotante con IA
│   │   ├── SalesChart.jsx       <- Graficos de ventas SVG
│   │   ├── InvoiceModal.jsx     <- Modal de factura PDF
│   │   └── ...
│   ├── pages/                   <- Vistas por rol
│   │   ├── AdminDashboard.jsx   <- Ventas, Facturas, PQR, Analitica
│   │   ├── EmployeeDashboard.jsx
│   │   └── ClientDashboard.jsx  <- Mis Facturas, Mis PQR
│   ├── services/api.js          <- Todas las llamadas al backend
│   └── utils/
│       ├── exportReports.js     <- Reportes PDF/Excel (avances anteriores)
│       └── exportSalesDaily.js  <- Reporte diario de ventas (Quinto Avance)
├── package.json                 <- Dependencias frontend (npm)
└── backend/                     <- Backend (Python + FastAPI)
    ├── app/
    │   ├── main.py              <- Punto de entrada FastAPI + routers
    │   ├── database.py          <- SQLAlchemy + init_db + semillas
    │   ├── dependencies.py      <- JWT, get_current_user, require_role
    │   ├── models/              <- Modelos ORM (User, Product, Sale, Invoice, PQR...)
    │   ├── schemas/             <- Validaciones Pydantic
    │   ├── routes/              <- Endpoints
    │   └── services/
    │       └── ai_service.py    <- Motor IA del Chatbot
    ├── database/
    │   ├── database.sqlite      <- BD SQLite (se autogenera)
    │   ├── schema.sql           <- Script DDL completo
    │   └── seed.sql             <- Datos de prueba
    ├── postman/
    │   ├── Nexus_Games_API.postman_collection.json
    │   └── Quinto_Avance_Nexus_Games.postman_collection.json
    ├── test_api.py              <- Pruebas avances anteriores
    ├── test_avance5_api.py      <- Pruebas Quinto Avance
    ├── requirements.txt         <- Dependencias Python
    └── .env                     <- Variables de entorno (no subir a Git)
```

> [!IMPORTANT]
> Este proyecto usa **FastAPI (Python)** como backend principal y **React + Vite** como frontend. El frontend se conecta al backend FastAPI en el **puerto 8000**.

---

## 📋 Requisitos Previos

| Herramienta | Versión Mínima | Verificar instalación |
|:------------|:---------------|:----------------------|
| **Node.js** | v18+           | `node -v`             |
| **npm**     | v9+            | `npm -v`              |
| **Python**  | v3.10+         | `py --version`        |
| **pip**     | Incluido       | `pip --version`       |

> [!TIP]
> En Windows con múltiples versiones de Python, usa `py -3.13` en lugar de `python`.

---

## ⚙️ PASO 1: Iniciar el Backend (FastAPI + Python)

### 1.1 Abrir terminal en la carpeta `backend`

```powershell
cd d:\Entregable4_corregido\Entregable4\backend
```

### 1.2 Crear el entorno virtual *(solo la primera vez)*

```powershell
Remove-Item -Recurse -Force .\venv
py -3.13 -m venv venv
```

> [!NOTE]
> Si ya existe `venv/` y funciona, omite este paso.

### 1.3 Activar el entorno virtual

**PowerShell:**
```powershell
.\venv\Scripts\Activate.ps1
```

**CMD:**
```cmd
.\venv\Scripts\activate.bat
```

> [!WARNING]
> Si PowerShell da error de "ejecucion de scripts deshabilitada", ejecuta como Administrador:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```

### 1.4 Instalar dependencias Python *(solo la primera vez)*

```powershell
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Instala: FastAPI, Uvicorn, SQLAlchemy, Pydantic, Bcrypt, python-jose (JWT), PyMySQL, email-validator.

### 1.5 Verificar el archivo `.env`

El archivo `.env` ya está preconfigurado. Verifica que tenga estas variables clave:

```ini
PORT=8000
HOST=127.0.0.1
ENVIRONMENT=development
DATABASE_URL=sqlite:///./database/database.sqlite
JWT_SECRET=nexus_games_super_secret_jwt_key_2026_sena
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# IA y Chatbot (Quinto Avance)
# Sin API Key: usa motor local inteligente (siempre funciona)
# Con API Key: conecta a proveedor externo (OpenAI, Gemini, Groq)
AI_PROVIDER=local_fallback
AI_API_KEY=
AI_API_URL=https://api.openai.com/v1/chat/completions
AI_MODEL=gpt-3.5-turbo
```

> [!IMPORTANT]
> **La base de datos se crea automaticamente** al iniciar el servidor. No necesitas ejecutar scripts SQL manualmente.

> [!CAUTION]
> Nunca subas `.env` con credenciales reales a Git. Ya esta excluido por `.gitignore`.

### 1.6 🟢 Iniciar el servidor FastAPI

```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Resultado esperado:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
Iniciando conexion con base de datos SQL y verificando tablas...
Base de datos y semillas listas.
INFO:     Application startup complete.
```

> [!IMPORTANT]
> No cierres esta terminal. El backend debe permanecer corriendo.

---

## 🌐 PASO 2: Iniciar el Frontend (React + Vite)

Abre una **segunda terminal**:

### 2.1 Ir a la raiz del proyecto

```powershell
cd d:\Entregable4_corregido\Entregable4
```

### 2.2 Instalar dependencias Node.js *(solo la primera vez)*

```powershell
npm install
```

> [!NOTE]
> Si hay errores de dependencias conflictivas: `npm install --legacy-peer-deps`

### 2.3 🟢 Iniciar Vite

```powershell
npm run dev
```

### 2.4 Abrir en el navegador

👉 **http://localhost:5173**

---

## 📖 PASO 3: Swagger UI (Documentacion de la API)

| Herramienta      | URL                                  | Descripcion                           |
|:-----------------|:-------------------------------------|:--------------------------------------|
| **Swagger UI**   | http://127.0.0.1:8000/docs           | Prueba interactiva de todos endpoints |
| **ReDoc**        | http://127.0.0.1:8000/redoc          | Documentacion legible alternativa     |
| **Health Check** | http://127.0.0.1:8000/api/health     | Confirma que el backend esta activo   |

**Para autenticarte en Swagger:**
1. `POST /api/auth/login` → Try it out → ingresar credenciales
2. Copiar el `token` de la respuesta
3. Clic en **Authorize** → escribir `Bearer <token>` → Authorize

---

## 🔑 Cuentas de Prueba

El sistema crea automaticamente 3 usuarios al iniciar:

| Rol               | Email                        | Contraseña     | Panel                                    |
|:------------------|:-----------------------------|:---------------|:-----------------------------------------|
| **Administrador** | `admin@nexusgames.com`       | `Admin123*`    | `/admin` — Gestion + Analitica + PQR     |
| **Empleado**      | `empleado@nexusgames.com`    | `Empleado123*` | `/employee` — Stock, Ventas, PQR         |
| **Cliente**       | `cliente@nexusgames.com`     | `Cliente123*`  | `/client` — Facturas, PQR, Perfil        |

---

## 🧪 PASO 4: Pruebas Automatizadas

**Tercera terminal** (con el backend corriendo):

```powershell
cd d:\Entregable4_corregido\Entregable4\backend
.\venv\Scripts\Activate.ps1
```

**Pruebas avances 1–4:**
```powershell
python test_api.py
```

**Pruebas Quinto Avance (Ventas, Facturas, PQR, Chatbot):**
```powershell
python test_avance5_api.py
```

---

## 📮 PASO 5: Postman *(Opcional)*

Importar en Postman:

| Coleccion                            | Archivo                                                    |
|:-------------------------------------|:-----------------------------------------------------------|
| Avances 1–4                          | `backend/postman/Nexus_Games_API.postman_collection.json`  |
| Quinto Avance (Ventas, PQR, Chatbot) | `backend/postman/Quinto_Avance_Nexus_Games.postman_collection.json` |

---

## 📌 Resumen Rapido — Comandos

```
TERMINAL 1 (Backend):
  cd d:\Entregable4_corregido\Entregable4\backend
  .\venv\Scripts\Activate.ps1
  pip install -r requirements.txt     <- solo 1ra vez
  uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

TERMINAL 2 (Frontend):
  cd d:\Entregable4_corregido\Entregable4
  npm install                         <- solo 1ra vez
  npm run dev

TERMINAL 3 (Pruebas):
  cd d:\Entregable4_corregido\Entregable4\backend
  .\venv\Scripts\Activate.ps1
  python test_api.py
  python test_avance5_api.py

URLs:
  Frontend:    http://localhost:5173
  Backend API: http://127.0.0.1:8000/api
  Swagger UI:  http://127.0.0.1:8000/docs
  Health:      http://127.0.0.1:8000/api/health
```

---

## 📂 Endpoints Completos de la API

### Autenticacion y Usuarios

| Metodo   | Ruta                         | Descripcion                       | Auth      |
|:---------|:-----------------------------|:----------------------------------|:----------|
| POST     | /api/auth/login              | Login → devuelve JWT              | Publico   |
| GET      | /api/auth/me                 | Perfil del usuario logueado       | JWT       |
| POST     | /api/auth/register           | Registrar nuevo cliente           | Publico   |
| POST     | /api/auth/recover-password   | Recuperar contraseña              | Publico   |
| GET      | /api/users                   | Listar usuarios                   | Admin     |
| POST     | /api/users                   | Crear usuario                     | Admin     |
| PUT      | /api/users/{id}              | Actualizar usuario                | Admin     |
| PATCH    | /api/users/{id}/status       | Activar/Desactivar usuario        | Admin     |
| DELETE   | /api/users/{id}              | Eliminar usuario                  | Admin     |

### Productos y Servicios

| Metodo   | Ruta                         | Descripcion                       | Auth           |
|:---------|:-----------------------------|:----------------------------------|:---------------|
| GET      | /api/products                | Catalogo de productos             | Publico        |
| POST     | /api/products                | Crear producto                    | Admin          |
| PUT      | /api/products/{id}           | Actualizar producto               | Admin          |
| PATCH    | /api/products/{id}/stock     | Ajustar stock                     | Admin/Empleado |
| DELETE   | /api/products/{id}           | Eliminar producto                 | Admin          |
| GET      | /api/services                | Catalogo de servicios             | Publico        |
| POST     | /api/services                | Crear servicio                    | Admin          |
| PUT      | /api/services/{id}           | Actualizar servicio               | Admin          |
| DELETE   | /api/services/{id}           | Eliminar servicio                 | Admin          |

### Pedidos

| Metodo | Ruta                    | Descripcion                  | Auth          |
|:-------|:------------------------|:-----------------------------|:--------------|
| POST   | /api/orders             | Crear pedido desde carrito   | JWT           |
| GET    | /api/orders/my-orders   | Mis pedidos                  | JWT           |
| GET    | /api/orders/all         | Todos los pedidos            | Admin/Empleado|

### NUEVO — Ventas y Facturacion (Quinto Avance)

| Metodo | Ruta                               | Descripcion                                  | Auth           |
|:-------|:-----------------------------------|:---------------------------------------------|:---------------|
| POST   | /api/sales                         | Registrar venta + genera factura automatica  | JWT            |
| GET    | /api/sales                         | Historial de ventas con filtros              | JWT            |
| GET    | /api/sales/daily?fecha=YYYY-MM-DD  | Reporte diario de ventas                     | Admin/Empleado |
| GET    | /api/sales/{id}                    | Detalle de venta por ID                      | JWT            |
| GET    | /api/invoices                      | Listar facturas                              | Admin/Empleado |
| GET    | /api/invoices/my-invoices          | Mis facturas (cliente)                       | JWT            |
| GET    | /api/invoices/{id}                 | Detalle de factura por ID                    | JWT            |
| GET    | /api/invoices/by-number/{nro}      | Buscar por numero (FACT-2026-00001)          | JWT            |

### NUEVO — PQR (Quinto Avance)

| Metodo | Ruta                      | Descripcion                            | Auth           |
|:-------|:--------------------------|:---------------------------------------|:---------------|
| POST   | /api/pqr                  | Radicar nueva PQR                      | JWT o Publico  |
| GET    | /api/pqr/my-pqr           | Mis PQR (cliente)                      | JWT            |
| GET    | /api/pqr/all              | Todas las PQR con filtros              | Admin/Empleado |
| GET    | /api/pqr/track/{radicado} | Consultar por numero de radicado       | Publico        |
| PATCH  | /api/pqr/{id}/respond     | Responder / cambiar estado             | Admin/Empleado |

### NUEVO — Chatbot con IA (Quinto Avance)

| Metodo | Ruta                              | Descripcion                        | Auth    |
|:-------|:----------------------------------|:-----------------------------------|:--------|
| POST   | /api/chatbot/message              | Enviar mensaje al chatbot con IA   | Publico |
| GET    | /api/chatbot/history/{session}    | Historial de conversacion          | Publico |

### Roles y Estadisticas

| Metodo | Ruta              | Descripcion                                              | Auth |
|:-------|:------------------|:---------------------------------------------------------|:-----|
| GET    | /api/roles        | Listar roles con permisos                                | No   |
| GET    | /api/roles/stats  | KPIs: usuarios, ventas, facturas, PQR                    | JWT  |

---

## 🤖 Configurar el Chatbot con IA Real *(Opcional)*

Por defecto usa el **motor local inteligente** (siempre funciona, sin API Key).

### Opcion A — OpenAI (GPT-3.5 / GPT-4)
```ini
AI_PROVIDER=openai
AI_API_KEY=sk-proj-xxxxxxxxxxxx
AI_API_URL=https://api.openai.com/v1/chat/completions
AI_MODEL=gpt-3.5-turbo
```

### Opcion B — Groq (llama3 — gratis y rapido)
```ini
AI_PROVIDER=openai
AI_API_KEY=gsk_xxxxxxxxxxxx
AI_API_URL=https://api.groq.com/openai/v1/chat/completions
AI_MODEL=llama3-8b-8192
```

### Opcion C — Google Gemini
```ini
AI_PROVIDER=gemini
AI_API_KEY=AIzaxxxxxxxxxxxxxxx
AI_MODEL=gemini-1.5-flash
```

> [!NOTE]
> Tras modificar `.env`, reinicia el servidor con Ctrl+C y vuelve a ejecutar `uvicorn`.

---

## 🐞 Solucion de Problemas

### Error: "No se puede ejecutar scripts" (PowerShell)
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Error: "python no se reconoce como comando"
Reinstala Python marcando "Add Python to PATH", o usa `py -3.13`.

### Error: "ModuleNotFoundError: No module named 'fastapi'"
El venv no esta activado. Ejecuta `.\venv\Scripts\Activate.ps1` primero.

### Error al crear venv: "python was not found"
```powershell
py -3.13 -m venv venv
```

### Puerto 8000 ocupado
```powershell
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Frontend no conecta con el backend
1. Confirmar backend corriendo en puerto 8000
2. Abrir http://127.0.0.1:8000/api/health en el navegador
3. Verificar CORS_ORIGINS en `.env` incluye http://localhost:5173

### npm ERR! ERESOLVE
```powershell
npm install --legacy-peer-deps
```

### Base de datos vacia o corrupta
```powershell
Remove-Item .\database\database.sqlite -ErrorAction SilentlyContinue
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Chatbot da error 500
Con `AI_PROVIDER=local_fallback` siempre funciona. Si usas proveedor externo, verifica que `AI_API_KEY` sea valida y tenga creditos. Reinicia el servidor tras cambiar `.env`.

---

## 📊 Funcionalidades del Quinto Avance

| Funcionalidad                    | Donde verla en la app                                          |
|:---------------------------------|:---------------------------------------------------------------|
| 🛒 Compra + Venta automatica     | Carrito de compras → genera venta y factura real               |
| 📄 Factura descargable en PDF    | Ventana InvoiceModal tras compra / pestaña Mis Facturas        |
| 📊 Graficos de ventas            | AdminDashboard → pestaña Ventas y Analitica                    |
| 📅 Reporte diario PDF/Excel      | AdminDashboard → pestaña Ventas y Analitica                    |
| 📋 Gestion de PQR                | Admin/Empleado → pestaña PQR / Cliente → Mis PQR               |
| 🤖 Chatbot IA flotante           | Boton 💬 esquina inferior derecha (todas las paginas)          |
| 📈 KPIs Dashboard Admin          | Cards con Facturacion total, PQR recibidas y PQR pendientes    |
| 🔍 Historial ventas con filtros  | Admin → pestaña Ventas, filtros por fecha/estado/cliente       |
