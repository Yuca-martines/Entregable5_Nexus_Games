from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from ..database import get_db
from ..models import Invoice, InvoiceDetail, User, Sale
from ..schemas import InvoiceResponse
from ..dependencies import get_current_user, require_role

router = APIRouter(prefix="/api/invoices", tags=["Facturación Comercial"])

def _format_invoice(inv: Invoice) -> dict:
    detalles = []
    for d in inv.detalles:
        detalles.append({
            "id": d.id,
            "tipo_item": d.tipo_item,
            "item_id": d.item_id,
            "descripcion": d.descripcion,
            "cantidad": d.cantidad,
            "precio_unitario": d.precio_unitario,
            "subtotal": d.subtotal
        })

    cliente = inv.cliente
    return {
        "id": inv.id,
        "numero_factura": inv.numero_factura,
        "venta_id": inv.venta_id,
        "cliente_id": inv.cliente_id,
        "cliente_nombre": f"{cliente.nombre} {cliente.apellido}" if cliente else "Cliente General",
        "cliente_documento": f"{cliente.tipo_documento} {cliente.numero_documento}" if cliente else "N/A",
        "cliente_email": cliente.email if cliente else "",
        "cliente_telefono": cliente.telefono if cliente else "",
        "cliente_direccion": cliente.direccion if cliente else "",
        "subtotal": inv.subtotal,
        "descuento": inv.descuento,
        "impuestos": inv.impuestos,
        "total": inv.total,
        "estado": inv.estado,
        "notas": inv.notas,
        "fecha_emision": inv.fecha_emision,
        "detalles": detalles
    }

@router.get("", summary="Consultar facturas con filtros por número, cliente o fecha")
def get_invoices(
    numero_factura: Optional[str] = None,
    cliente_nombre: Optional[str] = None,
    fecha: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Invoice).join(Invoice.cliente)

    # Si es cliente, solo ve sus propias facturas
    if current_user.rol_id == 3:
        query = query.filter(Invoice.cliente_id == current_user.id)
    elif cliente_nombre:
        term = f"%{cliente_nombre}%"
        query = query.filter((User.nombre.ilike(term)) | (User.apellido.ilike(term)) | (User.numero_documento.ilike(term)))

    if numero_factura:
        query = query.filter(Invoice.numero_factura.ilike(f"%{numero_factura}%"))

    if fecha:
        try:
            target_date = datetime.strptime(fecha, "%Y-%m-%d").date()
            start_dt = datetime.combine(target_date, datetime.min.time())
            end_dt = datetime.combine(target_date, datetime.max.time())
            query = query.filter(Invoice.fecha_emision >= start_dt, Invoice.fecha_emision <= end_dt)
        except ValueError:
            pass

    invoices = query.order_by(Invoice.id.desc()).all()
    formatted = [_format_invoice(inv) for inv in invoices]

    return {
        "success": True,
        "count": len(formatted),
        "invoices": formatted
    }

@router.get("/my-invoices", summary="Consultar facturas del cliente autenticado")
def get_my_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoices = db.query(Invoice).filter(Invoice.cliente_id == current_user.id).order_by(Invoice.id.desc()).all()
    formatted = [_format_invoice(inv) for inv in invoices]
    return {
        "success": True,
        "count": len(formatted),
        "invoices": formatted
    }

@router.get("/{id}", summary="Consultar una factura por ID")
def get_invoice_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = db.query(Invoice).filter(Invoice.id == id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Factura no encontrada.")

    if current_user.rol_id == 3 and inv.cliente_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tiene permisos para ver esta factura.")

    return {
        "success": True,
        "factura": _format_invoice(inv)
    }

@router.get("/by-number/{numero_factura}", summary="Consultar factura por su número correlativo")
def get_invoice_by_number(
    numero_factura: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = db.query(Invoice).filter(Invoice.numero_factura == numero_factura).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Factura no encontrada.")

    if current_user.rol_id == 3 and inv.cliente_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tiene permisos para ver esta factura.")

    return {
        "success": True,
        "factura": _format_invoice(inv)
    }
