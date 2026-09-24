from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime

from ..database import get_db
from ..models import InventoryMovement, Product, User
from ..schemas import InventoryAdjustCreate, InventoryMovementResponse
from ..dependencies import get_current_user, require_role

router = APIRouter(prefix="/api/inventory", tags=["Inventario y Kardex"])

def _format_movement(m: InventoryMovement) -> dict:
    return {
        "id": m.id,
        "producto_id": m.producto_id,
        "producto_nombre": m.producto.nombre if m.producto else "Producto",
        "producto_imagen": m.producto.imagen if m.producto else "",
        "tipo_movimiento": m.tipo_movimiento,
        "cantidad": m.cantidad,
        "stock_anterior": m.stock_anterior,
        "stock_nuevo": m.stock_nuevo,
        "motivo": m.motivo,
        "referencia": m.referencia,
        "usuario_id": m.usuario_id,
        "usuario_nombre": f"{m.usuario.nombre} {m.usuario.apellido}" if m.usuario else "Sistema",
        "creado_en": m.creado_en
    }

@router.get("/movements", summary="Consultar historial de movimientos de inventario (Kardex)")
def get_inventory_movements(
    producto_id: Optional[int] = None,
    tipo_movimiento: Optional[str] = None,
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador", "Empleado"]))
):
    query = db.query(InventoryMovement)

    if producto_id:
        query = query.filter(InventoryMovement.producto_id == producto_id)

    if tipo_movimiento:
        query = query.filter(InventoryMovement.tipo_movimiento == tipo_movimiento)

    if fecha_inicio:
        try:
            fi = datetime.strptime(fecha_inicio, "%Y-%m-%d")
            query = query.filter(InventoryMovement.creado_en >= fi)
        except ValueError:
            pass

    if fecha_fin:
        try:
            ff = datetime.strptime(f"{fecha_fin} 23:59:59", "%Y-%m-%d %H:%M:%S")
            query = query.filter(InventoryMovement.creado_en <= ff)
        except ValueError:
            pass

    movements = query.order_by(InventoryMovement.id.desc()).all()
    return {
        "success": True,
        "count": len(movements),
        "movements": [_format_movement(m) for m in movements]
    }

@router.post("/adjust", summary="Ajuste manual de stock con registro en Kardex")
def adjust_stock(
    data: InventoryAdjustCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador", "Empleado"]))
):
    product = db.query(Product).filter(Product.id == data.producto_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")

    stock_anterior = product.stock
    nuevo_stock = max(0, int(data.nuevo_stock))
    delta = nuevo_stock - stock_anterior

    if delta == 0:
        return {
            "success": True,
            "message": "El stock no requirió modificación (mismo valor).",
            "stock": nuevo_stock
        }

    # Actualizar producto
    product.stock = nuevo_stock

    # Registrar Kardex
    tipo = "AJUSTE_MANUAL_INCREMENTO" if delta > 0 else "AJUSTE_MANUAL_DECREMENTO"
    mov = InventoryMovement(
        producto_id=product.id,
        tipo_movimiento="AJUSTE_MANUAL",
        cantidad=delta,
        stock_anterior=stock_anterior,
        stock_nuevo=nuevo_stock,
        motivo=data.motivo.strip() if data.motivo else "Ajuste manual desde panel",
        referencia=f"Ajuste por {current_user.nombre}",
        usuario_id=current_user.id
    )
    db.add(mov)
    db.commit()
    db.refresh(product)

    return {
        "success": True,
        "message": f"Stock de '{product.nombre}' actualizado de {stock_anterior} a {nuevo_stock} unidades.",
        "producto_id": product.id,
        "stock_anterior": stock_anterior,
        "stock_nuevo": nuevo_stock
    }

@router.get("/summary", summary="Resumen y valoración del inventario")
def get_inventory_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador", "Empleado"]))
):
    products = db.query(Product).all()

    total_products = len(products)
    total_units = sum(p.stock for p in products)
    total_valuation = sum(p.stock * p.precio for p in products)
    critical_stock_products = [
        {
            "id": p.id,
            "nombre": p.nombre,
            "stock": p.stock,
            "precio": p.precio,
            "imagen": p.imagen,
            "categoria": p.categoria.nombre if p.categoria else "General"
        }
        for p in products if p.stock <= 5
    ]

    return {
        "success": True,
        "summary": {
            "total_productos": total_products,
            "total_unidades": total_units,
            "unidades_totales": total_units,
            "valoracion_total_inventario": total_valuation,
            "valor_total_inventario": total_valuation,
            "cantidad_stock_critico": len(critical_stock_products),
            "productos_stock_bajo": len(critical_stock_products),
            "productos_agotados": sum(1 for p in products if p.stock == 0),
            "productos_stock_critico": critical_stock_products
        }
    }
