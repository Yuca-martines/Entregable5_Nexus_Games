# 📁 ESTRUCTURA DEL PROYECTO — NEXUS GAMES

> **Stack:** React 19 + Vite 8 (Frontend) · Node.js + Express 5 (Backend) · SQLite (Base de datos) · JWT + Bcrypt (Autenticación)  
> **Proyecto académico:** Ficha 3406204 — SENA  

---

## 🗂️ Árbol de directorios

```
Entregable4/
├── 📄 index.html               ← Punto de entrada HTML del frontend
├── 📄 vite.config.js           ← Configuración de Vite (bundler frontend)
├── 📄 package.json             ← Dependencias del frontend
├── 📄 .gitignore               ← Archivos ignorados por Git
├── 📄 .oxlintrc.json           ← Configuración del linter (Oxlint)
├── 📄 README.md                ← Documentación general del proyecto
│
├── 📁 public/                  ← Archivos estáticos públicos (imágenes, íconos)
├── 📁 dist/                    ← Build de producción (generado por Vite)
│
├── 📁 src/                     ← Código fuente del FRONTEND (React)
│   ├── 📄 main.jsx             ← Punto de entrada de React (monta App)
│   ├── 📄 App.jsx              ← Componente raíz: rutas y proveedores globales
│   ├── 📄 App.css              ← Estilos base del componente App
│   ├── 📄 index.css            ← Sistema de diseño global (variables, tokens, utilidades)
│   │
│   ├── 📁 pages/               ← Páginas/vistas completas de la aplicación
│   │   ├── Index.jsx           ← Página de inicio (Hero, carrusel, destacados)
│   │   ├── Catalog.jsx         ← Catálogo de productos con filtros y búsqueda
│   │   ├── About.jsx           ← Página "Quiénes somos"
│   │   ├── Contact.jsx         ← Página de contacto con formulario
│   │   ├── AdminDashboard.jsx  ← Panel de Administrador (CRUD completo)
│   │   ├── EmployeeDashboard.jsx ← Panel de Empleado (stock, inventario, pedidos)
│   │   └── ClientDashboard.jsx ← Panel de Cliente (perfil, historial de compras)
│   │
│   ├── 📁 components/          ← Componentes reutilizables
│   │   ├── Header.jsx          ← Barra de navegación superior
│   │   ├── Footer.jsx          ← Pie de página
│   │   ├── AuthModal.jsx       ← Modal de Login / Registro / Recuperar contraseña
│   │   ├── CartDrawer.jsx      ← Panel lateral del carrito de compras
│   │   ├── GameCard.jsx        ← Tarjeta individual de producto/juego
│   │   ├── Carousel.jsx        ← Carrusel de imágenes/banners
│   │   ├── DashboardSidebar.jsx← Menú lateral para los paneles de usuario
│   │   ├── ProtectedRoute.jsx  ← Guard de rutas por rol (Admin, Empleado, Cliente)
│   │   ├── WhatsAppButton.jsx  ← Botón flotante de contacto WhatsApp
│   │   └── 📁 ui/             ← Componentes de UI primitivos
│   │       ├── Badge.jsx       ← Etiqueta/insignia de estado
│   │       ├── Button.jsx      ← Botón reutilizable con variantes
│   │       ├── Input.jsx       ← Campo de entrada de formulario
│   │       └── Modal.jsx       ← Contenedor modal genérico
│   │
│   ├── 📁 context/             ← Estado global con React Context API
│   │   ├── AuthContext.jsx     ← Autenticación: usuario, token, login/logout
│   │   └── CartContext.jsx     ← Carrito: productos, cantidades, total
│   │
│   ├── 📁 services/            ← Capa de comunicación con el backend
│   │   └── api.js              ← Todas las llamadas HTTP (fetch + JWT)
│   │
│   ├── 📁 utils/               ← Funciones auxiliares / helpers
│   │   └── formatCurrency.js   ← Formateador de moneda (COP, USD, etc.)
│   │
│   ├── 📁 assets/              ← Imágenes, íconos y recursos estáticos del src
│   └── 📁 data/                ← Datos estáticos locales (si aplica)
│
└── 📁 backend/                 ← Código fuente del BACKEND (Node.js + Express)
    ├── 📄 server.js            ← Punto de entrada del servidor Express
    ├── 📄 package.json         ← Dependencias del backend
    ├── 📄 .env                 ← Variables de entorno (secretas, no subir a Git)
    ├── 📄 .env.example         ← Plantilla de variables de entorno
    ├── 📄 test_api.py          ← Script de pruebas automatizadas con Python
    ├── 📄 requirements.txt     ← Dependencias Python para las pruebas
    │
    ├── 📁 config/              ← Configuración del servidor
    │   └── db.js               ← Inicialización y conexión a SQLite
    │
    ├── 📁 database/            ← Archivos de la base de datos
    │   ├── schema.sql          ← Definición de tablas (DDL)
    │   ├── seed.sql            ← Datos iniciales de prueba (DML)
    │   └── database.sqlite     ← Archivo de base de datos SQLite (generado)
    │
    ├── 📁 routes/              ← Definición de endpoints por módulo
    │   ├── authRoutes.js       ← /api/auth/*
    │   ├── userRoutes.js       ← /api/users/*
    │   ├── productRoutes.js    ← /api/products/*
    │   ├── serviceRoutes.js    ← /api/services/*
    │   ├── roleRoutes.js       ← /api/roles/*
    │   └── orderRoutes.js      ← /api/orders/*
    │
    ├── 📁 controllers/         ← Lógica de negocio por módulo
    │   ├── authController.js   ← Login, registro, perfil, recuperar contraseña
    │   ├── userController.js   ← CRUD de usuarios, cambio de estado
    │   ├── productController.js← CRUD de productos, categorías, control de stock
    │   ├── serviceController.js← CRUD de servicios
    │   ├── roleController.js   ← Listado de roles y estadísticas
    │   └── orderController.js  ← Creación y consulta de pedidos
    │
    ├── 📁 middlewares/         ← Middlewares de Express
    │   ├── authMiddleware.js   ← Verificación de JWT (token válido)
    │   └── roleMiddleware.js   ← Verificación de permisos por rol
    │
    ├── 📁 app/                 ← Módulo auxiliar Python / FastAPI legacy
    │   ├── main.py             ← Entrypoint alternativo
    │   ├── database.py         ← Conexión a BD desde Python
    │   ├── 📁 models/          ← Modelos de datos Python
    │   ├── 📁 schemas/         ← Esquemas de validación (Pydantic)
    │   ├── 📁 routes/          ← Rutas Python
    │   ├── 📁 dependencies/    ← Dependencias de inyección
    │   └── 📁 utils/           ← Utilidades Python
    │
    └── 📁 postman/             ← Colecciones Postman para pruebas manuales
```

---

## 🧩 Descripción de capas

### Frontend — `src/`

| Capa | Carpeta | Responsabilidad |
|------|---------|-----------------|
| **Entrada** | `main.jsx` | Monta el árbol de React en el DOM |
| **Rutas** | `App.jsx` | Define rutas con `react-router-dom` y aplica guards |
| **Páginas** | `pages/` | Vistas completas; cada archivo = una URL |
| **Componentes** | `components/` | Piezas reutilizables de UI |
| **UI primitivos** | `components/ui/` | Botones, inputs, modales sin lógica de negocio |
| **Estado global** | `context/` | `AuthContext` (sesión) y `CartContext` (carrito) |
| **API** | `services/api.js` | Única fuente de verdad para las peticiones HTTP |
| **Utilidades** | `utils/` | Funciones puras sin efectos secundarios |

### Backend — `backend/`

| Capa | Carpeta | Responsabilidad |
|------|---------|-----------------|
| **Servidor** | `server.js` | Crea la app Express, registra middlewares y rutas globales |
| **Rutas** | `routes/` | Mapeo de URL → controlador (thin layer) |
| **Controladores** | `controllers/` | Lógica de negocio: validación, consultas, respuestas HTTP |
| **Middlewares** | `middlewares/` | Validación de JWT y control de acceso por rol |
| **Configuración** | `config/db.js` | Abre/inicializa la conexión con SQLite |
| **Base de datos** | `database/` | Schema SQL, datos semilla y archivo `.sqlite` |

---

## 🔐 Sistema de Autenticación y Roles

```
Usuario hace login
    │
    ▼
authController → verifica email + password (bcrypt)
    │
    ▼
Genera JWT con payload: { id, nombre, email, rol }
    │
    ▼
Frontend guarda token en localStorage ("nexus_token")
    │
    ▼
Cada petición adjunta: Authorization: Bearer <token>
    │
    ▼
authMiddleware → verifica y decodifica el JWT
    │
    ▼
roleMiddleware → comprueba que el rol tenga permiso
```

### Roles del sistema

| Rol | ID | Acceso |
|-----|----|--------|
| **Administrador** | 1 | Todo: usuarios, productos, servicios, pedidos, roles |
| **Empleado** | 2 | Panel empleado: stock, inventario, pedidos |
| **Cliente** | 3 | Panel cliente: perfil, historial de compras |

---

## 🗄️ Modelo de Base de Datos (SQLite)

```
roles ──────────────────────── rol_permisos ──── permisos
  │                                      
  └── usuarios (rol_id → roles.id)
            │
            └── pedidos (usuario_id → usuarios.id)
                    │
                    └── pedido_detalles (pedido_id, producto_id)
                                              │
                                        productos (categoria_id → categorias.id)

servicios  (tabla independiente)
```

### Tablas principales

| Tabla | Descripción |
|-------|-------------|
| `roles` | Administrador, Empleado, Cliente |
| `permisos` | Permisos granulares por módulo |
| `rol_permisos` | Relación muchos a muchos (rol ↔ permiso) |
| `usuarios` | Datos de usuario con hash de contraseña y rol |
| `categorias` | Categorías de productos |
| `productos` | Juegos, hardware y accesorios con stock |
| `servicios` | Mantenimiento, armado de PC, asesoría |
| `pedidos` | Ventas / órdenes por usuario |
| `pedido_detalles` | Líneas de detalle de cada pedido |

---

## 🌐 API REST — Endpoints principales

| Módulo | Método | Endpoint | Acceso |
|--------|--------|----------|--------|
| **Auth** | POST | `/api/auth/login` | Público |
| **Auth** | POST | `/api/auth/register` | Público |
| **Auth** | GET | `/api/auth/me` | Autenticado |
| **Auth** | POST | `/api/auth/recover-password` | Público |
| **Usuarios** | GET | `/api/users` | Admin |
| **Usuarios** | POST | `/api/users` | Admin |
| **Usuarios** | PUT | `/api/users/:id` | Admin |
| **Usuarios** | PATCH | `/api/users/:id/status` | Admin |
| **Usuarios** | DELETE | `/api/users/:id` | Admin |
| **Productos** | GET | `/api/products` | Público |
| **Productos** | POST | `/api/products` | Admin |
| **Productos** | PUT | `/api/products/:id` | Admin |
| **Productos** | PATCH | `/api/products/:id/stock` | Admin/Empleado |
| **Productos** | DELETE | `/api/products/:id` | Admin |
| **Servicios** | GET | `/api/services` | Público |
| **Servicios** | POST/PUT/DELETE | `/api/services` | Admin |
| **Roles** | GET | `/api/roles` | Autenticado |
| **Roles** | GET | `/api/roles/stats` | Admin |
| **Pedidos** | POST | `/api/orders` | Autenticado |
| **Pedidos** | GET | `/api/orders/my-orders` | Cliente |
| **Pedidos** | GET | `/api/orders/all` | Admin/Empleado |
| **Health** | GET | `/api/health` | Público |

---

## 🚀 Cómo ejecutar el proyecto

### 1. Backend (puerto 5000)
```bash
cd backend
npm install
npm run dev
```

### 2. Frontend (puerto 5173)
```bash
# En la raíz del proyecto
npm install
npm run dev
```

### Variables de entorno (`backend/.env`)
```
PORT=5000
JWT_SECRET=tu_clave_secreta
NODE_ENV=development
```

---

## 📦 Dependencias clave

### Frontend
| Paquete | Versión | Uso |
|---------|---------|-----|
| `react` | ^19 | Librería UI principal |
| `react-router-dom` | ^7 | Enrutamiento SPA |
| `lucide-react` | ^1.31 | Íconos SVG |
| `vite` | ^8 | Bundler y servidor de desarrollo |

### Backend
| Paquete | Versión | Uso |
|---------|---------|-----|
| `express` | ^5 | Framework HTTP |
| `jsonwebtoken` | ^9 | Generación y verificación de JWT |
| `bcryptjs` | ^3 | Hashing de contraseñas |
| `cors` | ^2.8 | Política de CORS |
| `dotenv` | ^17 | Variables de entorno |

> **Nota:** La base de datos es SQLite pura — no se necesita instalar ningún motor externo. El archivo `database.sqlite` se genera automáticamente al iniciar el servidor.
