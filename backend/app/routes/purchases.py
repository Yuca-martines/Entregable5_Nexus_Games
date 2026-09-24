from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime

from ..database import get_db
from ..models import Purchase, PurchaseDetail, Supplier, Product, InventoryMovement, User
from ..schemas import (
    SupplierCreate,
    SupplierUpdate,
    SupplierResponse,
    PurchaseCreate,
    PurchaseResponse
)
from ..dependencies import get_current_user, require_role

router = APIRouter(prefix="/api/purchases", tags=["Compras y Proveedores"])

def _format_supplier(s: Supplier) -> dict:
    return {
        "id": s.id,
        "nit_rut": s.nit_rut,
        "razon_social": s.razon_social,
        "contacto_nombre": s.contacto_nombre,
        "telefono": s.telefono,
        "email": s.email,
        "direccion": s.direccion,
        "ciudad": s.ciudad,
        "estado": s.estado,
        "creado_en": s.creado_en
    }

def _format_purchase(p: Purchase) -> dict:
    detalles = []
    for d in p.detalles:
        detalles.append({
            "id": d.id,
            "producto_id": d.producto_id,
            "producto_nombre": d.producto.nombre if d.producto else "Producto",
            "producto_imagen": d.producto.imagen if d.producto else "",
            "cantidad": d.cantidad,
            "precio_costo_unitario": d.precio_costo_unitario,
            "subtotal": d.subtotal
        })

    return {
        "id": p.id,
        "numero_compra": p.numero_compra,
        "proveedor_id": p.proveedor_id,
        "proveedor_nombre": p.proveedor.razon_social if p.proveedor else "Proveedor General",
        "proveedor_nit": p.proveedor.nit_rut if p.proveedor else "N/A",
        "proveedor_telefono": p.proveedor.telefono if p.proveedor else "",
        "usuario_id": p.usuario_id,
        "usuario_nombre": f"{p.usuario.nombre} {p.usuario.apellido}" if p.usuario else "Administrador",
        "subtotal": p.subtotal,
        "impuestos": p.impuestos,
        "total": p.total,
        "metodo_pago": p.metodo_pago,
        "estado": p.estado,
        "notas": p.notas,
        "fecha_hora": p.fecha_hora,
        "detalles": detalles
    }

# =========================================================================
# GESTIÓN DE PROVEEDORES
# =========================================================================

@router.get("/suppliers", summary="Listar todos los proveedores")
def get_suppliers(
    search: Optional[str] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador", "Empleado"]))
):
    query = db.query(Supplier)
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            (Supplier.razon_social.ilike(term)) |
            (Supplier.nit_rut.ilike(term)) |
            (Supplier.contacto_nombre.ilike(term)) |
            (Supplier.email.ilike(term))
        )
    if estado:
        query = query.filter(Supplier.estado == estado)

    suppliers = query.order_by(Supplier.id.desc()).all()
    formatted = [_format_supplier(s) for s in suppliers]
    return {
        "success": True,
        "count": len(suppliers),
        "suppliers": formatted,
        "proveedores": formatted
    }

@router.post("/suppliers", status_code=status.HTTP_201_CREATED, summary="Registrar un nuevo proveedor")
def create_supplier(
    data: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador"]))
):
    # Verificar NIT único
    existing = db.query(Supplier).filter(Supplier.nit_rut == data.nit_rut.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="El NIT/RUT ya está registrado para otro proveedor.")

    supplier = Supplier(
        nit_rut=data.nit_rut.strip(),
        razon_social=data.razon_social.strip(),
        contacto_nombre=data.contacto_nombre.strip() if data.contacto_nombre else None,
        telefono=data.telefono.strip(),
        email=data.email.strip().lower(),
        direccion=data.direccion.strip() if data.direccion else None,
        ciudad=data.ciudad.strip() if data.ciudad else "Bogotá",
        estado=data.estado or "Activo"
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)

    return {
        "success": True,
        "message": "Proveedor registrado exitosamente.",
        "supplier": _format_supplier(supplier)
    }

@router.put("/suppliers/{id}", summary="Actualizar información de proveedor")
def update_supplier(
    id: int,
    data: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador"]))
):
    supplier = db.query(Supplier).filter(Supplier.id == id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado.")

    if data.nit_rut and data.nit_rut.strip() != supplier.nit_rut:
        conflict = db.query(Supplier).filter(Supplier.nit_rut == data.nit_rut.strip(), Supplier.id != id).first()
        if conflict:
            raise HTTPException(status_code=400, detail="El NIT/RUT ya pertenece a otro proveedor.")
        supplier.nit_rut = data.nit_rut.strip()

    if data.razon_social:
        supplier.razon_social = data.razon_social.strip()
    if data.contacto_nombre is not None:
        supplier.contacto_nombre = data.contacto_nombre.strip()
    if data.telefono:
        supplier.telefono = data.telefono.strip()
    if data.email:
        supplier.email = data.email.strip().lower()
    if data.direccion is not None:
        supplier.direccion = data.direccion.strip()
    if data.ciudad:
        supplier.ciudad = data.ciudad.strip()
    if data.estado:
        supplier.estado = data.estado

    db.commit()
    db.refresh(supplier)

    return {
        "success": True,
        "message": "Proveedor actualizado correctamente.",
        "supplier": _format_supplier(supplier)
    }

# =========================================================================
# GESTIÓN Y REGISTRO DE COMPRAS (FLUJO REAL DE ABASTECIMIENTO)
# =========================================================================

@router.post("", status_code=status.HTTP_201_CREATED, summary="Registrar compra y aumentar stock (Transaccional)")
def create_purchase(
    purchase_data: PurchaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador", "Empleado"]))
):
    if not purchase_data.items or len(purchase_data.items) == 0:
        raise HTTPException(status_code=400, detail="La compra debe incluir al menos un producto.")

    supplier = db.query(Supplier).filter(Supplier.id == purchase_data.proveedor_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="El proveedor seleccionado no existe.")

    # Generar correlativo de compra
    count_purchases = db.query(Purchase).count() + 1
    current_year = datetime.now().year
    numero_compra = f"COMP-{current_year}-{count_purchases:05d}"

    subtotal_acum = 0.0
    detalles_to_insert = []

    # Validar y preparar productos
    for item in purchase_data.items:
        if item.cantidad <= 0:
            raise HTTPException(status_code=400, detail="La cantidad debe ser mayor a 0.")
        if item.precio_costo_unitario < 0:
            raise HTTPException(status_code=400, detail="El costo unitario no puede ser negativo.")

        product = db.query(Product).filter(Product.id == item.producto_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"El producto con ID {item.producto_id} no existe.")

        item_subtotal = round(item.cantidad * item.precio_costo_unitario, 2)
        subtotal_acum += item_subtotal

        detalles_to_insert.append({
            "product": product,
            "cantidad": item.cantidad,
            "costo_unitario": item.precio_costo_unitario,
            "subtotal": item_subtotal,
            "stock_anterior": product.stock
        })

    # Calcular impuestos IVA 19%
    impuestos = round(subtotal_acum * 0.19, 2)
    total = round(subtotal_acum + impuestos, 2)

    # 1. Crear Orden de Compra
    new_purchase = Purchase(
        numero_compra=numero_compra,
        proveedor_id=supplier.id,
        usuario_id=current_user.id,
        subtotal=subtotal_acum,
        impuestos=impuestos,
        total=total,
        metodo_pago=purchase_data.metodo_pago or "Transferencia Bancaria",
        estado="Completada",
        notas=purchase_data.notas
    )
    db.add(new_purchase)
    db.flush()

    # 2. Insertar detalles, incrementar stock en productos y asentar movimientos en Kardex
    for d in detalles_to_insert:
        p = d["product"]
        cant = d["cantidad"]
        stock_ant = d["stock_anterior"]
        stock_nuevo = stock_ant + cant

        # Insertar detalle de compra
        detail = PurchaseDetail(
            compra_id=new_purchase.id,
            producto_id=p.id,
            cantidad=cant,
            precio_costo_unitario=d["costo_unitario"],
            subtotal=d["subtotal"]
        )
        db.add(detail)

        # Actualizar stock en producto
        p.stock = stock_nuevo

        # Registrar movimiento en Kardex
        mov = InventoryMovement(
            producto_id=p.id,
            tipo_movimiento="ENTRADA_COMPRA",
            cantidad=cant,
            stock_anterior=stock_ant,
            stock_nuevo=stock_nuevo,
            motivo=f"Recepción de compra proveedor {supplier.razon_social}",
            referencia=numero_compra,
            usuario_id=current_user.id
        )
        db.add(mov)

    db.commit()
    db.refresh(new_purchase)

    return {
        "success": True,
        "message": f"¡Compra {numero_compra} registrada exitosamente! El stock ha sido actualizado e ingresado al Kardex.",
        "compra": _format_purchase(new_purchase)
    }

@router.get("", summary="Listar historial de compras")
def get_purchases(
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    proveedor_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador", "Empleado"]))
):
    query = db.query(Purchase)
    if proveedor_id:
        query = query.filter(Purchase.proveedor_id == proveedor_id)

    if fecha_inicio:
        try:
            fi = datetime.strptime(fecha_inicio, "%Y-%m-%d")
            query = query.filter(Purchase.fecha_hora >= fi)
        except ValueError:
            pass

    if fecha_fin:
        try:
            ff = datetime.strptime(f"{fecha_fin} 23:59:59", "%Y-%m-%d %H:%M:%S")
            query = query.filter(Purchase.fecha_hora <= ff)
        except ValueError:
            pass

    purchases = query.order_by(Purchase.id.desc()).all()
    formatted = [_format_purchase(p) for p in purchases]
    return {
        "success": True,
        "count": len(purchases),
        "purchases": formatted,
        "compras": formatted
    }

@router.get("/{id}", summary="Consultar detalle de una compra")
def get_purchase_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador", "Empleado"]))
):
    purchase = db.query(Purchase).filter(Purchase.id == id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Compra no encontrada.")

    return {
        "success": True,
        "compra": _format_purchase(purchase)
    }
