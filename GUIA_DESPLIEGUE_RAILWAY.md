# 🚀 GUÍA PASO A PASO: DESPLIEGUE DE NEXUS GAMES EN RAILWAY
### Despliegue Completo: Backend (FastAPI + SQLite con Persistencia) y Frontend (React + Vite)

Esta guía detalla el proceso exacto para desplegar el proyecto **Nexus Games** en la plataforma en la nube **Railway** ([railway.com](https://railway.com)), garantizando que la base de datos no se borre al reiniciar y que el Frontend se comunique fluidamente con la API.

---

## 📋 Resumen de Arquitectura en Railway

En Railway crearemos **1 Proyecto** con **2 Servicios**:
1. **Servicio Backend (FastAPI en Python):** Procesa la lógica de negocio, autenticación JWT, compras, ventas, kardex y aloja la base de datos SQL persistente.
2. **Servicio Frontend (React 19 + Vite):** Interfaz de usuario conectada al dominio público del backend.

---

## 🛠️ PASO 1: Preparar tu Cuenta en Railway

1. Entra a [https://railway.com](https://railway.com) (o [railway.app](https://railway.app)).
2. Haz clic en **Login** e inicia sesión con tu cuenta de **GitHub**.
3. Asegúrate de tener acceso al repositorio: `https://github.com/Yuca-martines/Entregable5_Nexus_Games.git`.

---

## ⚙️ PASO 2: Desplegar el BACKEND en Railway

### 2.1. Crear el Servicio del Backend
1. En el Dashboard de Railway, haz clic en el botón **`+ New Project`**.
2. Selecciona **`Deploy from GitHub repo`**.
3. Busca y selecciona el repositorio **`Entregable5_Nexus_Games`** (o `Yuca-martines/Entregable5_Nexus_Games`).
4. Haz clic en **`Deploy Now`**.

### 2.2. Configurar la Carpeta del Backend (Root Directory)
Dado que el backend está dentro de la subcarpeta `backend/`, debemos indicárselo a Railway:
1. Haz clic en la tarjeta del servicio recién creado.
2. Ve a la pestaña **`Settings`** (Configuración).
3. Busca la sección **`General`** -> **`Root Directory`**.
4. Haz clic en **Edit** y escribe:
   ```text
   backend
   ```
5. Guarda los cambios.

### 2.3. Configurar los Comandos de Build y Start
En la misma pestaña **`Settings`**, baja a la sección **`Deploy`**:
* **Build Command:** (Dejar vacío o poner):
  ```bash
  pip install -r requirements.txt
  ```
* **Custom Start Command:** Escribe exactamente:
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```

### 2.4. Configurar Variables de Entorno del Backend
1. Ve a la pestaña **`Variables`** del servicio Backend.
2. Haz clic en **`+ New Variable`** o **`Raw Editor`** y agrega las siguientes variables:

| Variable | Valor Recomendado | Descripción |
| :--- | :--- | :--- |
| `PORT` | `8000` | Puerto interno de escucha |
| `SECRET_KEY` | `NexusGamesSuperSecretKeyJwt2026SecureProductionToken` | Llave para encriptar JWT |
| `ALGORITHM` | `HS256` | Algoritmo de firma JWT |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | 24 horas de vigencia |
| `CORS_ORIGINS` | `*` | Permite peticiones desde el frontend |
| `ENVIRONMENT` | `production` | Modo de ejecución |

### 2.5. Generar el Dominio Público del Backend
1. En la pestaña **`Settings`**, busca la sección **`Networking`** -> **`Public Networking`**.
2. Haz clic en **`Generate Domain`**.
3. Railway te generará una URL pública similar a:
   ```text
   https://backend-production-xxxx.up.railway.app
   ```
4. 📋 **Copia esta URL**, la necesitarás para el Frontend y para probar el Swagger en:
   `https://tu-backend.up.railway.app/docs`

### 2.6. (Opcional Recomendado) Configurar Persistencia de la Base de Datos SQLite
Para que las compras, ventas y usuarios registrados no se pierdan si el contenedor se reinicia:
1. En la tarjeta del Backend, ve a la pestaña **`Volumes`**.
2. Haz clic en **`+ Add Volume`** / **`New Volume`**.
3. En **Mount Path**, escribe:
   ```text
   /app/database
   ```
4. Haz clic en **Save** o **Add**.

---

## 🎨 PASO 3: Desplegar el FRONTEND en Railway

Ahora vamos a desplegar la interfaz web en el mismo proyecto para que se conecte a la API.

### 3.1. Agregar el Servicio del Frontend
1. En la vista principal de tu proyecto en Railway, haz clic en el botón **`+ Create`** (esquina superior derecha).
2. Selecciona **`GitHub Repo`**.
3. Selecciona nuevamente el repositorio **`Entregable5_Nexus_Games`**.

### 3.2. Configurar la Carpeta del Frontend (Root Directory)
1. Haz clic en la nueva tarjeta creada (puedes renombrarla a `Frontend` en *Settings*).
2. Ve a la pestaña **`Settings`** -> **`Root Directory`**.
3. Déjalo como `/` (o déjalo vacío, ya que el `package.json` y `vite.config.js` están en la raíz).

### 3.3. Configurar los Comandos de Build y Start
En la pestaña **`Settings`** -> sección **`Deploy`**:
* **Build Command:**
  ```bash
  npm install && npm run build
  ```
* **Custom Start Command:**
  ```bash
  npx serve -s dist -l $PORT
  ```
  *(O alternativamente `npx vite preview --host 0.0.0.0 --port $PORT`)*

### 3.4. Configurar la Variable de Conexión a la API
1. Ve a la pestaña **`Variables`** del servicio Frontend.
2. Agrega la siguiente variable con la URL que copiaste del Backend en el Paso 2.5:

| Variable | Valor |
| :--- | :--- |
| `VITE_API_URL` | `https://tu-backend-production-xxxx.up.railway.app` |

*(No te preocupes si le pones `/api` o no al final, el frontend ya está configurado para normalizarlo automáticamente).*

### 3.5. Generar el Dominio Público del Frontend
1. En la pestaña **`Settings`** del Frontend, ve a **`Networking`** -> **`Public Networking`**.
2. Haz clic en **`Generate Domain`**.
3. Obtendrás la URL pública de tu tienda:
   ```text
   https://frontend-production-xxxx.up.railway.app
   ```

---

## 🌟 ALTERNATIVA RECOMENDADA PARA EL FRONTEND: VERCEL (100% Gratis y Ultrarrápido)

Si prefieres desplegar el Frontend en **Vercel** (muy popular por su velocidad con Vite/React):

1. Ve a [https://vercel.com](https://vercel.com) e inicia sesión con GitHub.
2. Haz clic en **`Add New...`** -> **`Project`**.
3. Importa el repositorio **`Entregable5_Nexus_Games`**.
4. **Framework Preset:** Selecciona `Vite`.
5. **Root Directory:** `./`
6. En **Environment Variables**, agrega:
   * **Name:** `VITE_API_URL`
   * **Value:** `https://tu-backend-production-xxxx.up.railway.app`
7. Haz clic en **`Deploy`**.
8. ¡En 30 segundos tendrás tu frontend en vivo con certificado SSL automático!

---

## ✅ PASO 4: Verificación y Pruebas del Sistema en Vivo

Una vez desplegados ambos servicios, realiza las siguientes pruebas:

### 1. Probar el Backend (Health & Swagger):
* Abre en tu navegador: `https://tu-backend.up.railway.app/api/health`
  * Respuesta esperada: `{"status": "online", "project": "Nexus Games API...", "version": "5.0.0"}`
* Abre la documentación interactiva: `https://tu-backend.up.railway.app/docs`

### 2. Probar el Frontend:
* Abre la URL de tu frontend: `https://tu-frontend.up.railway.app`
* Inicia sesión con cualquiera de las credenciales oficiales:

| Rol | Correo | Contraseña |
| :--- | :--- | :--- |
| **Administrador** | `admin@nexus.com` | `Admin1234*` |
| **Empleado** | `empleado@nexus.com` | `Empleado1234*` |
| **Cliente** | `cliente@nexus.com` | `Cliente1234*` |

### 3. Probar el Flujo Transaccional en Vivo:
1. **Catálogo & Carrito:** Agrega un juego o accesorio al carrito y completa la compra.
2. **Kardex:** Entra como Administrador al panel de *Inventario / Kardex* y verifica el movimiento registrado automáticamente.
3. **Proveedores y Compras:** Registra una orden de compra a un proveedor y comprueba cómo sube el stock en tiempo real.
4. **Analítica:** Revisa los gráficos y métricas del Dashboard calculadas directamente con SQL.

---

## 🆘 Solución a Problemas Frecuentes en Railway

* **¿El build del backend falla por dependencias?**
  * Asegúrate de que el *Root Directory* sea `backend` para que encuentre el archivo `requirements.txt`.
* **¿Error de CORS en el navegador al hacer login?**
  * Verifica que en las variables del backend esté `CORS_ORIGINS=*`.
* **¿El frontend no carga datos de productos?**
  * Revisa en la pestaña *Network* del navegador (F12) que las peticiones se estén enviando a `https://tu-backend.up.railway.app/api/productos` y no a `localhost`. Si es necesario, vuelve a hacer un *Redeploy* del frontend tras configurar la variable `VITE_API_URL`.
