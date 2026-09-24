# 🎮 NEXUS GAMES - SISTEMA INTEGRAL DE GESTIÓN Y E-COMMERCE
### Quinto Avance – Sistema Transaccional Completo, Compras, Ventas, Kardex y Analítica en Tiempo Real

![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Bundler-Vite%208-646CFF?logo=vite&logoColor=white)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/ORM-SQLAlchemy-D71F00?logo=sqlalchemy&logoColor=white)
![SQLite](https://img.shields.io/badge/Database-SQLite%203-003B57?logo=sqlite&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT%20Bcrypt-black?logo=jsonwebtokens&logoColor=white)
![Railway](https://img.shields.io/badge/Desplegado%20en-Railway-8B5CF6?logo=railway&logoColor=white)

---

## 🌐 Demo en Producción (Railway)

| Servicio | URL en Vivo |
| :--- | :--- |
| 🎨 **Frontend (Tienda)** | [https://creative-rebirth-nexusgmaes.up.railway.app](https://creative-rebirth-nexusgmaes.up.railway.app) |
| ⚙️ **Backend API REST** | [https://entregable5nexusgames-nexusgmaes.up.railway.app](https://entregable5nexusgames-nexusgmaes.up.railway.app) |
| 📖 **Swagger UI (Docs interactivos)** | [https://entregable5nexusgames-nexusgmaes.up.railway.app/docs](https://entregable5nexusgames-nexusgmaes.up.railway.app/docs) |
| 🏥 **Health Check API** | [https://entregable5nexusgames-nexusgmaes.up.railway.app/api/health](https://entregable5nexusgames-nexusgmaes.up.railway.app/api/health) |

---



## 📌 Descripción del Proyecto

**Nexus Games** es una plataforma web Full Stack de nivel empresarial diseñada para la comercialización de hardware de alto rendimiento, consolas, videojuegos y servicios técnicos especializados. 

En este **Quinto Avance**, el sistema ha evolucionado de un prototipo a un **sistema transaccional 100% conectado a base de datos relacional SQL**, donde cada acción (compra a proveedor, venta a cliente, ajuste de inventario o ticket de soporte) genera consecuencias automáticas e inmediatas en la contabilidad, el stock (Kardex) y las métricas analíticas del negocio.

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                 FRONTEND (React 19 + Vite)                  │
│  - SPA con React Router DOM v7                              │
│  - Context API para Auth JWT & Carrito de Compras           │
│  - Dashboards reactivos por Rol (Admin / Empleado / Cliente)│
│  - Estilos modernos Dark / Gold con Lucide Icons            │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST / JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 BACKEND (FastAPI + Python)                  │
│  - Inyección de dependencias y middlewares CORS             │
│  - Autenticación JWT y Hashing seguro con Bcrypt            │
│  - Control de Acceso Basado en Roles (RBAC)                 │
│  - Lógica de negocio y transacciones ACID en SQLite         │
│  - Swagger UI & ReDoc integrados                            │
└──────────────────────────────┬──────────────────────────────┘
                               │ SQLAlchemy ORM
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 BASE DE DATOS RELACIONAL                    │
│  - Tablas normalizadas con Foreign Keys & CHECK constraints │
│  - Trazabilidad integral de compras, ventas y Kardex        │
│  - Agregaciones SQL reales para métricas de negocio         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Módulos y Lógica de Negocio Implementada

### 1. 🏢 Gestión Integral de Proveedores (`/api/proveedores`)
- Registro y actualización de proveedores con Validación de NIT/RUT, razón social, persona de contacto, teléfono, correo y dirección.
- Estados de activación para suspender proveedores sin romper la integridad referencial histórica.

### 2. 📦 Módulo de Compras e Ingreso de Mercancía (`/api/compras`)
- Creación de órdenes de compra asociadas a un proveedor existente.
- Desglose detallado de ítems (producto, cantidad comprada, precio unitario de costo).
- Cálculo automático de subtotal, IVA (19%) y total.
- **Consecuencia de Negocio:** Al registrarse o marcarse como `recibida`, el sistema incrementa automáticamente el stock de cada producto en la base de datos y genera el respectivo movimiento de entrada en el Kardex.

### 3. 📊 Control de Inventario y Movimientos (Kardex) (`/api/inventario`)
- Registro inmutable de cada alteración de existencias con fecha, hora, tipo de movimiento (`ENTRADA`, `SALIDA`, `AJUSTE`), cantidad, stock previo, stock resultante, motivo y referencia de documento.
- Historial filtrable para auditorías de inventario en tiempo real.

### 4. 💳 Ventas y Facturación Electrónica Simulada (`/api/ventas`)
- Generación de ventas con código de factura único consecutivo (ej. `FAC-2026-XXXX`).
- Desglose de ítems con validación de stock disponible.
- Asociación automática de cliente, método de pago (Tarjeta, Transferencia, Efectivo) e impuestos.
- Generación de factura electrónica simulada vinculada al pedido.

### 5. 🛒 Carrito de Compras y Checkout Atómico (`/api/pedidos`)
- Validación de existencias en el servidor antes de procesar el pago.
- Bloqueo y descuento transaccional del stock en base de datos.
- Creación de la orden, detalles del pedido y registro automático de salida en el Kardex.

### 6. 🛠️ Servicios Técnicos y Sistema PQRS (`/api/servicios`, `/api/soporte`)
- Registro de solicitudes de mantenimiento y reparación con seguimiento por estados (`recibido`, `en_diagnostico`, `en_reparacion`, `finalizado`, `entregado`).
- Módulo de PQRS (Peticiones, Quejas, Reclamos y Sugerencias) para clientes.

### 7. 📈 Dashboard y Analítica en Tiempo Real (`/api/roles/dashboard-stats`)
- Los paneles de administración ya no utilizan datos estáticos ("mock").
- **Cálculo directo mediante consultas SQL agregadas:**
  - Ingresos brutos totales (suma de ventas facturadas).
  - Compras totales e inversión en mercancía.
  - Valoración total del inventario actual a precio de venta y costo.
  - Alertas automáticas de stock bajo y productos agotados.
  - Top de productos más vendidos.

### 8. 🤖 Chatbot Asistente Nexus IA
- Asistente virtual en frontend con motor de respuestas inteligentes para orientar a clientes sobre catálogo, métodos de pago, garantías y horarios de atención.

---

## 👥 Roles de Usuario y Control de Acceso (RBAC)

| Rol | Permisos y Alcance |
| :--- | :--- |
| **👑 Administrador** | Acceso total al sistema: gestión de usuarios, roles, catálogo de productos, compras a proveedores, ventas, facturación, kardex, PQRS, servicios técnicos y métricas financieras globales. |
| **👔 Empleado** | Gestión operativa: registro y actualización de productos, recepción de compras a proveedores, consulta de stock/kardex, atención de servicios técnicos y registro de ventas. |
| **🛍️ Cliente** | Catálogo público, carrito de compras con checkout en tiempo real, consulta de historial de pedidos, descarga de comprobantes de facturas y radicación de solicitudes de soporte/servicio. |

---

## 🔑 Credenciales de Acceso Preconfiguradas

Para pruebas inmediatas, la base de datos incluye los siguientes usuarios de demostración (contraseñas con hash Bcrypt):

| Rol | Correo Electrónico | Contraseña |
| :--- | :--- | :--- |
| **Administrador** | `admin@nexus.com` | `Admin1234*` |
| **Empleado** | `empleado@nexus.com` | `Empleado1234*` |
| **Cliente** | `cliente@nexus.com` | `Cliente1234*` |

---

## 📁 Estructura del Repositorio

```
Entregable5/
├── backend/                              # Servidor REST API en FastAPI
│   ├── app/
│   │   ├── dependencies/
│   │   │   └── auth.py                   # Middleware de autenticación JWT y roles
│   │   ├── models/                       # Modelos ORM SQLAlchemy
│   │   │   ├── user.py                   # Usuarios y perfiles
│   │   │   ├── role.py                   # Roles y permisos RBAC
│   │   │   ├── product.py                # Productos y categorías
│   │   │   ├── supplier.py               # Proveedores de mercancía
│   │   │   ├── purchase.py               # Compras y órdenes a proveedores
│   │   │   ├── inventory_movement.py     # Kardex y trazabilidad de inventario
│   │   │   ├── sale.py                   # Ventas directas
│   │   │   ├── invoice.py                # Facturación electrónica
│   │   │   ├── order.py                  # Pedidos de clientes
│   │   │   └── service.py                # Servicios técnicos
│   │   ├── routes/                       # Endpoints y controladores de la API
│   │   │   ├── auth.py                   # Login, perfil y recuperación
│   │   │   ├── users.py                  # CRUD de usuarios
│   │   │   ├── products.py               # CRUD de productos y categorías
│   │   │   ├── suppliers.py              # Gestión de proveedores
│   │   │   ├── purchases.py              # Compras y recepción de stock
│   │   │   ├── inventory.py              # Consulta y ajustes de Kardex
│   │   │   ├── sales.py                  # Facturación y ventas
│   │   │   ├── orders.py                 # Checkout y pedidos
│   │   │   ├── services.py               # Tickets de servicio técnico
│   │   │   └── roles.py                  # Estadísticas y métricas del dashboard
│   │   ├── schemas/                      # Validaciones estrictas con Pydantic v2
│   │   ├── utils/                        # Hashing y utilidades de seguridad
│   │   ├── database.py                   # Inicialización de DB y Seed automático
│   │   └── main.py                       # Configuración de FastAPI y CORS
│   ├── test_integration.py               # Suite de pruebas de integración completa
│   ├── test_avance5_api.py               # Pruebas automatizadas de los nuevos módulos
│   └── requirements.txt                  # Dependencias de Python
├── src/                                  # Aplicación Frontend en React 19
│   ├── components/                       # Componentes reutilizables y layout
│   │   ├── ui/                           # UI primitives (Botones, Modales, Inputs)
│   │   ├── Header.jsx                    # Barra de navegación con estado de sesión
│   │   ├── CartDrawer.jsx                # Panel deslizante del carrito
│   │   ├── AuthModal.jsx                 # Modal de login/registro con validaciones
│   │   └── ChatBot.jsx                   # Asistente virtual Nexus AI
│   ├── context/                          # Estado global (AuthContext y CartContext)
│   ├── pages/                            # Vistas principales y Dashboards
│   │   ├── AdminDashboard.jsx            # Panel completo de Administración
│   │   ├── EmployeeDashboard.jsx         # Panel de Empleado y Gestión Operativa
│   │   ├── ClientDashboard.jsx           # Panel de Cliente y Mis Pedidos
│   │   ├── Catalog.jsx                   # Catálogo de productos con filtros
│   │   ├── Index.jsx                     # Página principal
│   │   ├── About.jsx                     # Acerca de nosotros
│   │   └── Contact.jsx                   # Contacto y soporte
│   ├── services/
│   │   └── api.js                        # Cliente Axios/Fetch centralizado
│   ├── App.jsx                           # Enrutamiento con React Router DOM v7
│   └── index.css                         # Sistema de diseño y estilos visuales
├── package.json                          # Dependencias de Node.js
├── vite.config.js                        # Configuración del bundler Vite
└── README.md                             # Documentación del proyecto
```

---

## ⚙️ Guía de Instalación y Ejecución

### 1. Clonar el Repositorio
```bash
git clone https://github.com/Yuca-martines/Entregable5_Nexus_Games.git
cd Entregable5_Nexus_Games
```

---

### 2. Configurar e Iniciar el Backend (FastAPI)

1. Abrir una terminal y navegar a la carpeta `backend`:
   ```bash
   cd backend
   ```
2. Crear y activar un entorno virtual de Python:
   - **En Windows:**
     ```bash
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **En Linux / macOS:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Instalar las dependencias:
   ```bash
   pip install -r requirements.txt
   ```
4. Iniciar el servidor Uvicorn:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   > 🌐 El servidor iniciará en: `http://127.0.0.1:8000`
   > 📖 Documentación interactiva Swagger UI: `http://127.0.0.1:8000/docs`
   > 📚 Documentación alternativa ReDoc: `http://127.0.0.1:8000/redoc`

---

### 3. Configurar e Iniciar el Frontend (React + Vite)

1. En una nueva terminal, ubicarse en la raíz del proyecto:
   ```bash
   npm install
   ```
2. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   > 🚀 La aplicación estará disponible en: `http://localhost:5173`

---

## 🧪 Pruebas Automatizadas

El backend cuenta con suites de pruebas unitarias y de integración end-to-end para garantizar la solidez de las transacciones y la integridad de los datos.

Para ejecutar las pruebas:
```bash
cd backend
python test_integration.py
```
**Resultado esperado:**
```text
================================================================================
  PRUEBAS DE INTEGRACION - SISTEMA NEXUS GAMES (ENTREGABLE 5)
================================================================================
[TEST 1] Registro y autenticacion JWT............................. [OK]
[TEST 2] Creacion de Proveedor y verificacion en DB............... [OK]
[TEST 3] Orden de Compra y aumento automatico de Stock............ [OK]
[TEST 4] Verificacion de Movimiento en Kardex (ENTRADA)........... [OK]
[TEST 5] Checkout / Venta con reduccion atomica de Stock.......... [OK]
[TEST 6] Verificacion de Movimiento en Kardex (SALIDA)............ [OK]
[TEST 7] Generacion de Factura Electronica y Consulta............. [OK]
[TEST 8] Estadisticas reales del Dashboard con agregaciones SQL... [OK]
================================================================================
  RESULTADO FINAL: 8/8 PRUEBAS EXITOSAS
================================================================================
```

---

## 🛡️ Seguridad y Buenas Prácticas

- **Protección de Contraseñas:** Algoritmo de hash Bcrypt con salting criptográfico.
- **Autenticación sin Estado:** JSON Web Tokens (JWT) firmados con algoritmo `HS256`.
- **Validación de Datos en Dos Capas:** Validación reactiva en cliente y validación estricta en servidor con Pydantic v2.
- **Integridad Transaccional:** Uso de sesiones de base de datos con rollback automático en caso de errores en operaciones críticas de stock y facturación.
- **CORS Configurado:** Permite la comunicación controlada entre el cliente React y el servidor FastAPI.

---

## 👥 Desarrolladores y Créditos

Proyecto desarrollado para el programa de formación en desarrollo de software – **SENA (Ficha: 3406204)**.

- **Repositorio Oficial:** [GitHub - Entregable5_Nexus_Games](https://github.com/Yuca-martines/Entregable5_Nexus_Games.git)
