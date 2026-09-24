


# Plan de Implementación: Quinto Avance – React + Vite + FastAPI + Base de Datos SQL + Inteligencia Artificial

Implementación conservadora y progresiva de los 20 requerimientos del Quinto Avance sobre el proyecto existente **Nexus Games**, respetando la regla principal de **NO TOCAR ni alterar lo que ya funciona**, aplicando la estrategia:
**AGREGAR > EXTENDER > REUTILIZAR > MODIFICAR > (último recurso) REEMPLAZAR**.

---

## 1. Lo que ya existe y funciona en el proyecto

### Backend (FastAPI + SQLAlchemy + SQLite/MySQL)
* **Arquitectura:** FastAPI montado en `backend/app/main.py` con middleware CORS, controladores de excepción estandarizados y endpoint `/api/health`.
* **Seguridad & Autenticación:** JWT Bearer tokens con expiración (`python-jose`), hashing seguro con Bcrypt (`passlib`), dependencias de autenticación `get_current_user` y autorización granular por roles `require_role`.
* **Modelos Relacionales Existentes (`backend/app/models`):**
  * `Role`, `Permission`, `RolePermission`: Sistema RBAC con 3 roles (Administrador=1, Empleado=2, Cliente=3) y 12 permisos.
  * `User`: Información completa de usuarios (cédula, contacto, dirección, email único, password hash, estado Activo/Inactivo).
  * `Category`: Categorías de videojuegos y hardware gamer.
  * `Product`: Catálogo de productos con precio, stock, plataforma, imagen, estado y control de inventario.
  * `TechnicalService`: Catálogo de servicios técnicos y optimizaciones para consolas y PC.
  * `Order`, `OrderDetail`: Modelo base de pedidos con items, total, método de pago y fecha.
* **Rutas Existentes (`backend/app/routes`):**
  * `/api/auth`: Login, registro, perfil actual (`/me`), recuperación de contraseña.
  * `/api/users`: CRUD completo de usuarios, cambio de estado activo/inactivo.
  * `/api/products`: CRUD completo de catálogo, categorías y ajuste de stock (delta/set).
  * `/api/services`: CRUD completo de servicios técnicos.
  * `/api/roles`: Listado de roles con permisos asociados y `/api/roles/stats` (KPIs de usuarios, productos, servicios y órdenes).
  * `/api/orders`: Creación de pedido con descuento de stock, consulta de órdenes propias (`/my-orders`) y de todos los pedidos (`/all`).

### Frontend (React + Vite)
* **Gestión de Estado:** `AuthContext` (sesión persistente en `localStorage`) y `CartContext` (carrito de compras interactivo).
* **Navegación & Vistas:** React Router DOM v7 con rutas públicas (`/`, `/catalog`, `/about`, `/contact`) y rutas protegidas por roles (`/admin`, `/employee`, `/client`).
* **Paneles de Control:**
  * `AdminDashboard.jsx`: Pestañas para gestión de Productos, Usuarios, Servicios, Roles, Pedidos y Reportes ejecutivos.
  * `EmployeeDashboard.jsx`: Pestañas de Inventario con ajuste rápido de stock, Servicios y Pedidos.
  * `ClientDashboard.jsx`: Historial de compras y actualización de perfil personal con validaciones.
* **Exportación de Reportes:** Utilidades en `src/utils/exportReports.js` con `jspdf`, `jspdf-autotable` y `xlsx` para generar informes corporativos de Inventario, Usuarios, Estadísticas y Pedidos.

---

## 2. Lo que exige el Quinto Avance (20 Requerimientos)

1. **Módulo de ventas:** Registrar ventas en el sitio web con cliente, usuario, productos, servicios, cantidades, precios, descuentos, subtotal, impuestos, total, fecha/hora y estado, persistido en SQL.
2. **Registro de productos y servicios vendidos:** Relación entre venta y detalle identificando productos y/o servicios comercializados con cantidades y precios.
3. **Historial de ventas:** Consulta con filtros por fecha, cliente, producto, servicio, estado y valor.
4. **Reporte diario de ventas:** Reporte filtrado por fecha con número de venta, cliente, items, valor, total y estado.
5. **Exportación del reporte en PDF:** Descarga de reporte diario con diseño corporativo y totales.
6. **Exportación del reporte en Excel:** Archivo `.xlsx` estructurado en columnas para análisis de datos.
7. **Generación de facturas de venta:** A partir de una operación comercial, con número de factura, fecha, datos del cliente, productos/servicios, subtotal, impuestos, total y estado.
8. **Consulta de facturas:** Búsqueda mediante número de factura, cliente o fecha.
9. **Descarga de facturas en PDF:** Generación o descarga directa del comprobante de factura.
10. **Dashboard administrativo:** Cards con indicadores consolidados (total usuarios, productos, servicios, ventas, facturación, PQR recibidas y pendientes).
11. **Dashboard de ventas:** Gráficos de barras, gráfico lineal e indicadores numéricos por día, semana o mes.
12. **Dashboards de acuerdo con los roles:** Vistas adaptadas a Administrador, Empleado y Cliente respetando permisos.
13. **Filtros para Dashboards:** Criterios por fecha inicial, fecha final, producto, servicio, estado y cliente.
14. **Nuevos endpoints en FastAPI:** Ventas, detalle de ventas, facturas, reportes, PQR, Chatbot y analítica.
15. **Integración del Dashboard con FastAPI:** Datos cargados dinámicamente desde la base de datos SQL.
16. **Módulo de PQR:** Registro de solicitudes (Petición, Queja, Reclamo) y consulta de estado (Pendiente, En Proceso, Respondida, Cerrada).
17. **Chatbot para atención al cliente:** Asistente interactivo en el sitio web para resolver preguntas frecuentes, catálogo, compras y PQR.
18. **Integración del Chatbot con Inteligencia Artificial:** Conexión con servicio de IA (OpenAI / Gemini / motor contextual FastAPI) para respuestas naturales.
19. **Gestión segura de la API Key:** Llaves configuradas exclusivamente en variables de entorno (`.env`), nunca hardcodeadas ni en Git.
20. **Integración completa y despliegue del proyecto:** Preparación para despliegue en la nube (Railway/Render/Vercel), URLs relativas/configurables por env, CORS, y evidencias.

---

## 3. Lo que ya está cumplido

* **Arquitectura tecnológica intacta:** React + Vite + FastAPI + Base de datos SQL con JWT y control de roles RBAC.
* **Seguridad base:** Contraseñas encriptadas con bcrypt, tokens JWT y protección de endpoints por rol.
* **Base de datos relacional:** Tablas de roles, permisos, rol_permisos, usuarios, categorias, productos, servicios, pedidos y pedido_detalles.
* **Dashboards base por rol:** Rutas `/admin`, `/employee`, `/client` funcionando con `ProtectedRoute`.
* **Exportación documental base:** Librerías `jspdf`, `jspdf-autotable` y `xlsx` ya integradas y operativas en el frontend.

---

## 4. Lo que falta implementar

* [ ] Entidades y tablas para **Ventas & Detalle de Ventas** que soporten productos Y servicios, descuentos e impuestos.
* [ ] Entidad y tabla de **Facturas** (`facturas` y `detalle_facturas`) ligadas a la venta comercial con numeración oficial (`FACT-2026-XXXX`).
* [ ] Endpoints FastAPI para Ventas y Facturación (historial con filtros, generación, búsqueda por fecha/cliente/nro y descarga en PDF).
* [ ] Generación y exportación de Reporte Diario de ventas en PDF y Excel con selector de fecha.
* [ ] Módulo de **PQR**:
  * Tabla `pqr` (id, usuario_id, cliente_nombre, email, tipo, asunto, descripcion, estado, respuesta, fecha_creacion, fecha_respuesta).
  * Endpoints FastAPI: radicación, consulta del cliente, listado para admin/empleado, actualización de estado y respuesta.
  * Interfaz de usuario para radicar y ver PQR (Cliente) y para responder y cambiar estado (Admin/Empleado).
* [ ] Módulo de **Chatbot con Inteligencia Artificial**:
  * Endpoint `/api/chatbot/message` en FastAPI con motor de conocimiento del catálogo de Nexus Games, precios, servicios, PQR y horario + integración opcional/configurable con API de IA vía variable de entorno `AI_API_KEY`.
  * Fallback contextual seguro que opera siempre con fluidez incluso si no se provee API Key externa, garantizando éxito continuo en evaluaciones y sustentaciones.
  * Componente flotante de Chatbot en React integrado a todas las páginas de la tienda con temática Gamer dorada/oscura.
* [ ] **Dashboard de Ventas & Analítica**:
  * Gráfico de barras (ventas por día/mes/categoría) y gráfico de líneas (tendencia de facturación en el tiempo) usando componentes SVG interactivos de alto rendimiento.
  * Cards de indicadores para el Administrador completando: Facturación total, PQR recibidas, PQR pendientes.
  * Filtros dinámicos por rango de fechas, estado y cliente.
* [ ] **Facturación en Frontend**:
  * Visualizador y descargador de factura en PDF para clientes y administradores.
  * Conexión del carrito de compras (`CartDrawer.jsx`) con el endpoint de venta y facturación real.
* [ ] **Script SQL Actualizado, Documentación & Pruebas**:
  * Actualización de `backend/database/schema.sql` y `seed.sql` con las nuevas tablas y datos iniciales de prueba.
  * Script automatizado de pruebas de endpoints (`backend/test_avance5_api.py`) y colección Postman JSON.
  * Configuración para despliegue en la nube (Railway/Render) con archivo de variables de entorno y documentación.

---

## 5. Archivos que será necesario CREAR

### Backend
1. `backend/app/models/sale.py`: Modelo SQLAlchemy para `Sale` (ventas) y `SaleDetail` (productos/servicios vendidos con impuestos y descuentos).
2. `backend/app/models/invoice.py`: Modelo SQLAlchemy para `Invoice` (facturas con correlativo único tipo `FACT-2026-0001`, fecha, totales, estado).
3. `backend/app/models/pqr.py`: Modelo SQLAlchemy para `PQR` (peticiones, quejas, reclamos y sugerencias con trazabilidad de estados y respuestas).
4. `backend/app/models/chat.py`: Modelo SQLAlchemy para `Conversation` y `ChatMessage` para soporte de historial de atención.
5. `backend/app/schemas/sale.py`: Esquemas Pydantic para validación de ventas y reportes.
6. `backend/app/schemas/invoice.py`: Esquemas Pydantic para consulta y emisión de facturas.
7. `backend/app/schemas/pqr.py`: Esquemas Pydantic para radicación, consulta y respuesta de PQR.
8. `backend/app/schemas/chatbot.py`: Esquemas Pydantic para mensajes del Chatbot.
9. `backend/app/services/ai_service.py`: Servicio inteligente que orquesta la respuesta contextualizada de IA usando `AI_API_KEY` (compatible con OpenAI/Gemini/Groq) y motor de respuestas basado en catálogo y soporte técnico.
10. `backend/app/routes/sales.py`: Endpoints para registrar venta, consultar historial con filtros (fecha, cliente, producto, servicio, estado, valor) y reporte diario.
11. `backend/app/routes/invoices.py`: Endpoints para consultar facturas (por número, cliente, fecha) y obtener datos formateados para impresión/descarga.
12. `backend/app/routes/pqr.py`: Endpoints para radicar PQR, listar PQR del usuario actual, listar todas las PQR para Admin/Empleado y responder/cerrar PQR.
13. `backend/app/routes/chatbot.py`: Endpoint interactivo de chat con IA para atención a clientes.
14. `backend/test_avance5_api.py`: Script de pruebas automatizadas para todos los nuevos endpoints.
15. `backend/postman/Quinto_Avance_Nexus_Games.postman_collection.json`: Colección completa de Postman para las evidencias solicitadas.

### Frontend
16. `src/components/ChatbotWidget.jsx`: Widget flotante de chat con IA en la esquina inferior derecha con temática Gamer dorada/oscura de Nexus Games.
17. `src/components/SalesChart.jsx`: Gráficos interactivos de barras y líneas con tooltips y animaciones SVG para el análisis de ventas por día, semana o mes.
18. `src/components/InvoiceModal.jsx`: Modal interactivo para previsualizar y descargar la factura en PDF corporativo oficial.
19. `src/utils/exportSalesDaily.js`: Módulo especializado en generar el reporte diario de ventas en PDF y Excel con el formato exacto exigido por el Quinto Avance.

### Documentación & Despliegue
20. `DOCUMENTACION_QUINTO_AVANCE.md`: Documento completo con evidencia de los 20 requerimientos, tabla de endpoints, guía de variables de entorno, y paso a paso para despliegue en Railway/Render.
21. `Procfile` y `render.yaml`: Archivos de configuración para despliegue en producción sin fricción.

---

## 6. Archivos existentes que sería necesario MODIFICAR y Justificación Técnica

| Archivo | Parte a Modificar | Por qué es estrictamente necesario | Funcionalidad existente potencialmente afectada |
| :--- | :--- | :--- | :--- |
| `backend/app/models/__init__.py` | Exportación de modelos | Requerido para exponer los nuevos modelos `Sale`, `SaleDetail`, `Invoice`, `PQR`, `Conversation`, `ChatMessage` junto a los existentes. | Ninguna. Solo añade exports. |
| `backend/app/schemas/__init__.py` | Exportación de esquemas | Requerido para centralizar los esquemas Pydantic de ventas, facturas, PQR y chatbot. | Ninguna. Solo añade exports. |
| `backend/app/database.py` | Función `init_db()` | Debe crear las nuevas tablas (`ventas`, `detalle_ventas`, `facturas`, `pqr`, `conversaciones`, `mensajes`) e insertar datos semilla de ejemplo para que las nuevas funcionalidades tengan datos inmediatos para probar. | Ninguna. SQLAlchemy `Base.metadata.create_all()` no altera tablas existentes. |
| `backend/app/routes/__init__.py` | Exportación de routers | Requerido para exportar `sales_router`, `invoices_router`, `pqr_router`, `chatbot_router`. | Ninguna. Solo añade exports. |
| `backend/app/main.py` | `app.include_router(...)` | Requerido para que FastAPI registre y active los 4 nuevos routers bajo el prefijo `/api/...`. | Ninguna. Las rutas anteriores (`/api/auth`, `/api/users`, etc.) permanecen intactas. |
| `backend/app/routes/roles.py` | Endpoint `/api/roles/stats` | Ampliar el diccionario de estadísticas para incluir `totalRevenue`, `totalInvoices`, `pqrReceived` y `pqrPending` requeridos en el Dashboard Administrativo. | Ninguna. Conserva las claves de KPIs anteriores y solo añade los nuevos campos. |
| `backend/database/schema.sql` | Al final del archivo SQL | Agregar la definición SQL de las tablas `ventas`, `detalle_ventas`, `facturas`, `detalle_facturas` y `pqr` para cumplir con el entregable del script SQL actualizado. | Ninguna. Solo añade sentencias `CREATE TABLE IF NOT EXISTS`. |
| `backend/database/seed.sql` | Al final del archivo SQL | Agregar registros semilla de ejemplo para ventas, facturas y PQR para pruebas directas en SQL/Postman. | Ninguna. Solo añade `INSERT OR IGNORE`. |
| `backend/.env` y `backend/.env.example` | Variables de entorno | Añadir `AI_API_KEY=`, `AI_PROVIDER=gemini` (o similar) para cumplir la regla de gestión segura de credenciales. | Ninguna. Las credenciales de DB y JWT siguen iguales. |
| `src/services/api.js` | Objeto de endpoints | Exponer `salesAPI`, `invoicesAPI`, `pqrAPI` y `chatbotAPI` para que el frontend pueda consumir los nuevos endpoints de FastAPI. | Ninguna. Las funciones existentes de `usersAPI`, `productsAPI`, `ordersAPI`, etc., no se tocan. |
| `src/App.jsx` | Retorno de componente | Añadir el componente `<ChatbotWidget />` para que el asistente de IA esté accesible en toda la aplicación. | Ninguna. No altera rutas ni lógica existente. |
| `src/components/CartDrawer.jsx` | Función `handleCheckout` | Conectar la compra con `salesAPI.create(...)` para que al comprar se genere una venta real persistida en SQL con su factura descargable, en lugar de un `setTimeout` estático. | Mejora el flujo de compra haciéndolo 100% funcional. |
| `src/pages/AdminDashboard.jsx` | Sidebar, Tabs y Cards | Agregar las nuevas pestañas: **Ventas & Analítica** (gráficos de barras, líneas y filtros), **Facturación** (consulta y descarga de facturas) y **PQR** (gestión y respuesta a reclamos); y actualizar las Cards de indicadores con Facturación acumulada, PQR recibidas y pendientes. | Las pestañas existentes (Productos, Usuarios, Servicios, Roles, Pedidos, Reportes) se mantienen 100% intactas. |
| `src/pages/EmployeeDashboard.jsx` | Sidebar y Tabs | Permitir al empleado acceder a la consulta de Ventas, Facturación y gestión de PQR según sus permisos. | Pestañas de inventario y pedidos existentes se mantienen intactas. |
| `src/pages/ClientDashboard.jsx` | Tabs | Agregar pestañas **Mis Facturas** (para consultar y descargar comprobantes en PDF) y **Mis PQR** (para radicar peticiones y consultar el estado en tiempo real). | Pestañas de Mis Compras y Datos Personales existentes se mantienen intactas. |

---

## 7. Plan de Verificación

### Pruebas Automatizadas del Backend
* Ejecutar script `backend/test_avance5_api.py` verificando:
  * Creación y listado de ventas de productos y servicios con cálculo de impuestos y subtotales.
  * Generación y consulta de facturas por número, cliente y fecha.
  * Generación de reporte diario en formato JSON, PDF y Excel.
  * Radicación, consulta y actualización de PQR (cambio a Respondida/Cerrada).
  * Interacción con el Chatbot de IA con consulta de catálogo y respuesta contextualizada.
  * Verificación de seguridad: endpoints protegidos con JWT y permisos por rol.

### Pruebas Manuales e Interactivas de Frontend
* Iniciar backend FastAPI y frontend Vite.
* Probar el flujo completo con los 3 roles:
  1. **Cliente:**
     * Abrir el Chatbot interactivo y hacer preguntas sobre precios, disponibilidad y cómo presentar una PQR.
     * Realizar una compra en el carrito -> Comprobar que genera venta y factura.
     * En `ClientDashboard`, consultar **Mis Facturas** y descargar la factura en PDF.
     * Radicar una PQR desde el panel de cliente y verificar que queda en estado `Pendiente`.
  2. **Empleado:**
     * En `EmployeeDashboard`, consultar el historial de ventas y facturas.
     * Atender la PQR del cliente asignándole estado `En Proceso`.
  3. **Administrador:**
     * En `AdminDashboard`, verificar las nuevas Cards de Indicadores (Facturación total, PQR recibidas, PQR pendientes).
     * Explorar la pestaña de **Ventas & Analítica**: interactuar con los gráficos de barras y de líneas, alternar filtros por día, semana, mes y rangos de fecha.
     * Generar y descargar el **Reporte Diario de Ventas** tanto en **PDF** como en **Excel (.xlsx)**.
     * En la pestaña **PQR**, emitir respuesta oficial a la PQR y marcarla como `Respondida` o `Cerrada`.
