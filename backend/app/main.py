import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from .database import init_db
from .routes import (
    auth_router,
    users_router,
    products_router,
    services_router,
    roles_router,
    orders_router,
    sales_router,
    invoices_router,
    pqr_router,
    chatbot_router,
    purchases_router,
    inventory_router
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicialización de tablas relacionales y datos semilla al arrancar
    print("Iniciando conexión con base de datos SQL y verificando tablas...")
    init_db()
    print("Base de datos y semillas listas.")
    yield
    print("Servidor FastAPI detenido.")

app = FastAPI(
    title="Nexus Games API - React + Vite + FastAPI + SQL + IA",
    description="""
    Documentación oficial interactiva con **Swagger UI** para el **Quinto Avance (SENA)**.
    
    ### Características de la API:
    * **Autenticación:** JSON Web Token (JWT) Bearer Token con expiración.
    * **Seguridad:** Hashing seguro de contraseñas mediante **Bcrypt**.
    * **Base de Datos:** Relacional SQL (SQLite / MySQL) persistente mediante **SQLAlchemy ORM**.
    * **Validaciones:** Validación estricta de esquemas y tipos de datos mediante **Pydantic**.
    * **Control de Roles:** Autorización basada en roles (Administrador, Empleado, Cliente) y permisos granulares.
    * **CRUD Completo:** Gestión de Usuarios, Productos, Control de Stock, Servicios Técnicos y Pedidos.
    * **Módulo de Ventas & Facturación:** Registro de ventas de productos y servicios con impuestos, descuentos y correlativo de facturas.
    * **Módulo de PQR:** Gestión de peticiones, quejas, reclamos y sugerencias con seguimiento de estados.
    * **Chatbot con IA:** Asistencia inteligente en tiempo real y soporte al cliente.
    """,
    version="5.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configuración de CORS
cors_origins_env = os.getenv("CORS_ORIGINS", "*")
origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
if "*" not in origins:
    origins.append("*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Manejadores de Excepciones Globales para estandarizar respuestas de error
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail
        },
        headers=getattr(exc, "headers", None)
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_details = []
    for err in exc.errors():
        field = " -> ".join([str(loc) for loc in err["loc"] if loc != "body"])
        error_details.append(f"{field}: {err['msg']}")

    first_msg = error_details[0] if error_details else "Error en la validación de los datos enviados."
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": f"Validación fallida: {first_msg}",
            "errors": exc.errors()
        }
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    print(f"Error inesperado no controlado: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "Ocurrió un error inesperado en el servidor.",
            "error": str(exc) if os.getenv("ENVIRONMENT") == "development" else None
        }
    )
# Endpoint raíz para verificar que el servidor está respondiendo
@app.get("/")
def root():
    return {
        "mensaje": "Nexus Games API funcionando",
        "health": "/api/health",
        "docs": "/docs"
    }
    
# Endpoint de Verificación de Estado (Health Check)
@app.get("/api/health", tags=["Salud del Sistema"], summary="Verificar estado de salud de la API")
def health_check():
    return {
        "status": "online",
        "project": "Nexus Games API - React + Vite + FastAPI + Base de Datos Relacional SQL + IA",
        "avance": "Quinto Avance - Gestión Comercial, Analítica, Despliegue e Inteligencia Artificial",
        "version": "5.0.0"
    }

# Registrar todos los routers de endpoints
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(products_router)
app.include_router(services_router)
app.include_router(roles_router)
app.include_router(orders_router)
app.include_router(sales_router)
app.include_router(invoices_router)
app.include_router(pqr_router)
app.include_router(chatbot_router)
app.include_router(purchases_router)
app.include_router(inventory_router)


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)
