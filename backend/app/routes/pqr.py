from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from ..database import get_db
from ..models import PQR, User
from ..schemas import PQRCreate, PQRResponseUpdate, PQRResponse
from ..dependencies import get_current_user, require_role, get_optional_current_user

router = APIRouter(prefix="/api/pqr", tags=["PQR - Peticiones, Quejas y Reclamos"])

def _format_pqr(p: PQR) -> dict:
    return {
        "id": p.id,
        "radicado": p.radicado,
        "usuario_id": p.usuario_id,
        "cliente_nombre": p.cliente_nombre,
        "cliente_email": p.cliente_email,
        "cliente_telefono": p.cliente_telefono,
        "tipo": p.tipo,
        "asunto": p.asunto,
        "descripcion": p.descripcion,
        "estado": p.estado,
        "respuesta": p.respuesta,
        "usuario_atencion_id": p.usuario_atencion_id,
        "usuario_atencion_nombre": f"{p.usuario_atencion.nombre} {p.usuario_atencion.apellido}" if p.usuario_atencion else None,
        "fecha_radicacion": p.fecha_radicacion,
        "fecha_respuesta": p.fecha_respuesta
    }

@router.post("", status_code=status.HTTP_201_CREATED, summary="Radicar una nueva solicitud de PQR")
def create_pqr(
    pqr_data: PQRCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    count_today = db.query(PQR).count() + 1
    current_year = datetime.now().year
    radicado = f"PQR-{current_year}-{count_today:05d}"

    nombre = pqr_data.cliente_nombre or (f"{current_user.nombre} {current_user.apellido}" if current_user else "Usuario Anónimo")
    email = pqr_data.cliente_email or (current_user.email if current_user else "contacto@cliente.com")
    telefono = pqr_data.cliente_telefono or (current_user.telefono if current_user else "")

    new_pqr = PQR(
        radicado=radicado,
        usuario_id=current_user.id if current_user else None,
        cliente_nombre=nombre,
        cliente_email=email,
        cliente_telefono=telefono,
        tipo=pqr_data.tipo,
        asunto=pqr_data.asunto,
        descripcion=pqr_data.descripcion,
        estado="Pendiente"
    )
    db.add(new_pqr)
    db.commit()
    db.refresh(new_pqr)

    return {
        "success": True,
        "message": f"¡Tu solicitud PQR ha sido radicada con éxito con el número de radicado {radicado}!",
        "pqr": _format_pqr(new_pqr)
    }

@router.get("/my-pqr", summary="Consultar las PQR radicadas por el cliente autenticado")
def get_my_pqr(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pqrs = db.query(PQR).filter(
        (PQR.usuario_id == current_user.id) | (PQR.cliente_email == current_user.email)
    ).order_by(PQR.id.desc()).all()

    formatted = [_format_pqr(p) for p in pqrs]
    return {
        "success": True,
        "count": len(formatted),
        "pqrs": formatted
    }

@router.get("/all", summary="Listar todas las PQR para Administradores y Empleados")
def get_all_pqr(
    estado: Optional[str] = None,
    tipo: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador", "Empleado"]))
):
    query = db.query(PQR)
    if estado:
        query = query.filter(PQR.estado == estado)
    if tipo:
        query = query.filter(PQR.tipo == tipo)

    pqrs = query.order_by(PQR.id.desc()).all()
    formatted = [_format_pqr(p) for p in pqrs]
    return {
        "success": True,
        "count": len(formatted),
        "pqrs": formatted
    }

@router.get("/track/{radicado}", summary="Consultar estado de una PQR por número de radicado (Público)")
def track_pqr(
    radicado: str,
    db: Session = Depends(get_db)
):
    p = db.query(PQR).filter(PQR.radicado == radicado).first()
    if not p:
        raise HTTPException(status_code=404, detail="Número de radicado no encontrado.")

    return {
        "success": True,
        "pqr": {
            "radicado": p.radicado,
            "tipo": p.tipo,
            "asunto": p.asunto,
            "estado": p.estado,
            "respuesta": p.respuesta,
            "fecha_radicacion": p.fecha_radicacion,
            "fecha_respuesta": p.fecha_respuesta
        }
    }

@router.patch("/{id}/respond", summary="Responder y actualizar estado de una PQR (Admin / Empleado)")
def respond_pqr(
    id: int,
    data: PQRResponseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador", "Empleado"]))
):
    p = db.query(PQR).filter(PQR.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="PQR no encontrada.")

    p.estado = data.estado
    p.respuesta = data.respuesta
    p.usuario_atencion_id = current_user.id
    p.fecha_respuesta = datetime.now()

    db.commit()
    db.refresh(p)

    return {
        "success": True,
        "message": f"PQR {p.radicado} actualizada exitosamente al estado '{p.estado}'.",
        "pqr": _format_pqr(p)
    }
