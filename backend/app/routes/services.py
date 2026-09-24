from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import TechnicalService, User
from ..schemas import ServiceCreate, ServiceUpdate
from ..dependencies import require_role

router = APIRouter(tags=["Servicios"])

def _format_service(s: TechnicalService) -> dict:
    return {
        "id": s.id,
        "nombre": s.nombre,
        "descripcion": s.descripcion,
        "precio": s.precio,
        "duracion_estimada": s.duracion_estimada or "24 Horas",
        "icono": s.icono or "Wrench",
        "estado": s.estado,
        "creado_en": s.creado_en
    }

# =========================================================================
# 1. LISTAR SERVICIOS
# =========================================================================
def handle_get_services(estado: Optional[str], db: Session):
    query = db.query(TechnicalService)
    if estado:
        query = query.filter(TechnicalService.estado == estado)
    services = query.order_by(TechnicalService.id.asc()).all()
    formatted = [_format_service(s) for s in services]
    return {
        "success": True,
        "count": len(formatted),
        "services": formatted
    }

@router.get("/api/servicios", summary="Consultar todos los servicios técnicos")
def get_servicios(estado: Optional[str] = Query(None), db: Session = Depends(get_db)):
    return handle_get_services(estado, db)

@router.get("/api/services", summary="Alias consultar servicios")
def get_services_alias(estado: Optional[str] = Query(None), db: Session = Depends(get_db)):
    return handle_get_services(estado, db)

# =========================================================================
# 2. CONSULTAR SERVICIO POR ID
# =========================================================================
def handle_get_service_by_id(id: int, db: Session):
    service = db.query(TechnicalService).filter(TechnicalService.id == id).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Servicio no encontrado.")
    return {
        "success": True,
        "service": _format_service(service)
    }

@router.get("/api/servicios/{id}", summary="Consultar servicio por ID")
def get_servicio_by_id(id: int, db: Session = Depends(get_db)):
    return handle_get_service_by_id(id, db)

@router.get("/api/services/{id}", summary="Alias consultar servicio por ID")
def get_service_alias(id: int, db: Session = Depends(get_db)):
    return handle_get_service_by_id(id, db)

# =========================================================================
# 3. CREAR SERVICIO (ADMIN)
# =========================================================================
def handle_create_service(data: ServiceCreate, db: Session):
    new_serv = TechnicalService(
        nombre=data.nombre.strip(),
        descripcion=data.descripcion.strip(),
        precio=data.precio,
        duracion_estimada=data.duracion_estimada or "24 Horas",
        icono=data.icono or "Wrench",
        estado=data.estado or "Activo"
    )
    db.add(new_serv)
    db.commit()
    db.refresh(new_serv)

    return {
        "success": True,
        "message": "Servicio registrado exitosamente.",
        "serviceId": new_serv.id,
        "service": _format_service(new_serv)
    }

@router.post("/api/servicios", status_code=status.HTTP_201_CREATED, summary="Crear servicio técnico (Admin)")
def create_servicio(
    data: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador"]))
):
    return handle_create_service(data, db)

@router.post("/api/services", status_code=status.HTTP_201_CREATED, summary="Alias crear servicio")
def create_service_alias(
    data: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador"]))
):
    return handle_create_service(data, db)

# =========================================================================
# 4. ACTUALIZAR SERVICIO (ADMIN)
# =========================================================================
def handle_update_service(id: int, data: ServiceUpdate, db: Session):
    serv = db.query(TechnicalService).filter(TechnicalService.id == id).first()
    if not serv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Servicio no encontrado.")

    if data.nombre is not None:
        serv.nombre = data.nombre.strip()
    if data.descripcion is not None:
        serv.descripcion = data.descripcion.strip()
    if data.precio is not None:
        serv.precio = data.precio
    if data.duracion_estimada is not None:
        serv.duracion_estimada = data.duracion_estimada
    if data.icono is not None:
        serv.icono = data.icono
    if data.estado is not None:
        serv.estado = data.estado

    db.commit()
    db.refresh(serv)

    return {
        "success": True,
        "message": "Servicio actualizado satisfactoriamente.",
        "service": _format_service(serv)
    }

@router.put("/api/servicios/{id}", summary="Actualizar servicio (Admin)")
def update_servicio(
    id: int,
    data: ServiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador"]))
):
    return handle_update_service(id, data, db)

@router.put("/api/services/{id}", summary="Alias actualizar servicio")
def update_service_alias(
    id: int,
    data: ServiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador"]))
):
    return handle_update_service(id, data, db)

# =========================================================================
# 5. ELIMINAR SERVICIO (ADMIN)
# =========================================================================
def handle_delete_service(id: int, db: Session):
    serv = db.query(TechnicalService).filter(TechnicalService.id == id).first()
    if not serv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Servicio no encontrado.")

    db.delete(serv)
    db.commit()

    return {
        "success": True,
        "message": "Servicio eliminado correctamente."
    }

@router.delete("/api/servicios/{id}", summary="Eliminar servicio (Admin)")
def delete_servicio(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador"]))
):
    return handle_delete_service(id, db)

@router.delete("/api/services/{id}", summary="Alias eliminar servicio")
def delete_service_alias(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador"]))
):
    return handle_delete_service(id, db)
