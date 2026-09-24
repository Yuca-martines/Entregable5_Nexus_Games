from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import Optional, List
from datetime import datetime, date

from ..database import get_db
from ..models import Sale, SaleDetail, Invoice, InvoiceDetail, Product, TechnicalService, User, InventoryMovement
from ..schemas import SaleCreate, SaleResponse
from ..dependencies import get_current_user, require_role

router = APIRouter(prefix="/api/sales", tags=["Ventas y Operaciones Comerciales"])

def _format_sale(s: Sale) -> dict:
    detalles = []
    for d in s.detalles:
        detalles.append({
            "id": d.id,
            "tipo_item": d.tipo_item,
            "producto_id": d.producto_id,
            "servicio_id": d.servicio_id,
            "nombre_item": d.nombre_item,
            "cantidad": d.cantidad,
            "precio_unitario": d.precio_unitario,
            "descuento": d.descuento,
            "subtotal": d.subtotal
        })

    return {
        "id": s.id,
        "numero_venta": s.numero_venta,
        "cliente_id": s.cliente_id,
        "cliente_nombre": f"{s.cliente.nombre} {s.cliente.apellido}" if s.cliente else "Cliente General",
        "cliente_documento": f"{s.cliente.tipo_documento} {s.cliente.numero_documento}" if s.cliente else "N/A",
        "cliente_email": s.cliente.email if s.cliente else "",
        "usuario_operacion_id": s.usuario_operacion_id,
        "subtotal": s.subtotal,
        "descuento": s.descuento,
        "impuestos": s.impuestos,
        "total": s.total,
        "metodo_pago": s.metodo_pago,
        "estado": s.estado,
        "notas": s.notas,
        "fecha_hora": s.fecha_hora,
        "factura_id": s.factura.id if s.factura else None,
        "numero_factura": s.factura.numero_factura if s.factura else None,
        "detalles": detalles
    }

@router.post("", status_code=status.HTTP_201_CREATED, summary="Registrar una nueva venta comercial")
def create_sale(
    sale_data: SaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not sale_data.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La venta debe contener al menos un producto o servicio."
        )

    # Determinar cliente
    cliente_id = current_user.id
    usuario_operacion_id = None
    if current_user.rol_id in [1, 2]: # Admin o Empleado
        usuario_operacion_id = current_user.id
        if sale_data.cliente_id:
            cliente_id = sale_data.cliente_id

    # Generar correlativo de venta
    count_today = db.query(Sale).count() + 1
    current_year = datetime.now().year
    numero_venta = f"VENT-{current_year}-{count_today:05d}"

    subtotal_acum = 0.0
    detalles_to_insert = []

    for item in sale_data.items:
        tipo = "Servicio" if item.tipo.lower() == "servicio" else "Producto"
        nombre_item = item.nombre or "Ítem Comercial"
        unit_price = float(item.precio or 0.0)

        if tipo == "Producto" and item.id:
            prod = db.query(Product).filter(Product.id == item.id).first()
            if not prod:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"El producto con ID {item.id} no existe."
                )

            nombre_item = prod.nombre
            if unit_price <= 0:
                unit_price = float(prod.precio)

            if item.cantidad > prod.stock:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"No hay stock suficiente para '{prod.nombre}'. Disponible: {prod.stock}, solicitado: {item.cantidad}."
                )

            prod.stock = max(0, prod.stock - item.cantidad)
        elif tipo == "Servicio" and item.id:
            serv = db.query(TechnicalService).filter(TechnicalService.id == item.id).first()
            if serv:
                nombre_item = serv.nombre
                if unit_price <= 0:
                    unit_price = float(serv.precio)

        item_subtotal = (unit_price * item.cantidad) - float(item.descuento or 0.0)
        subtotal_acum += max(0.0, item_subtotal)

        detalles_to_insert.append({
            "tipo_item": tipo,
            "producto_id": item.id if tipo == "Producto" else None,
            "servicio_id": item.id if tipo == "Servicio" else None,
            "nombre_item": nombre_item,
            "cantidad": item.cantidad,
            "precio_unitario": unit_price,
            "descuento": float(item.descuento or 0.0),
            "subtotal": max(0.0, item_subtotal)
        })

    descuento_general = float(sale_data.descuento_general or 0.0)
    base_imponible = max(0.0, subtotal_acum - descuento_general)
    # Impuesto IVA del 19%
    impuestos = round(base_imponible * 0.19, 2)
    total = round(base_imponible + impuestos, 2)

    new_sale = Sale(
        numero_venta=numero_venta,
        cliente_id=cliente_id,
        usuario_operacion_id=usuario_operacion_id,
        subtotal=subtotal_acum,
        descuento=descuento_general,
        impuestos=impuestos,
        total=total,
        metodo_pago=sale_data.metodo_pago or "Tarjeta de Crédito / PSE",
        estado="Completada",
        notas=sale_data.notas
    )
    db.add(new_sale)
    db.flush()

    for d in detalles_to_insert:
        sale_detail = SaleDetail(
            venta_id=new_sale.id,
            tipo_item=d["tipo_item"],
            producto_id=d["producto_id"],
            servicio_id=d["servicio_id"],
            nombre_item=d["nombre_item"],
            cantidad=d["cantidad"],
            precio_unitario=d["precio_unitario"],
            descuento=d["descuento"],
            subtotal=d["subtotal"]
        )
        db.add(sale_detail)

        # Si fue un producto, asentar Kardex
        if d["tipo_item"] == "Producto" and d["producto_id"]:
            prod = db.query(Product).filter(Product.id == d["producto_id"]).first()
            if prod:
                mov = InventoryMovement(
                    producto_id=prod.id,
                    tipo_movimiento="SALIDA_VENTA",
                    cantidad=-d["cantidad"],
                    stock_anterior=prod.stock + d["cantidad"],
                    stock_nuevo=prod.stock,
                    motivo=f"Venta directa mostrador {numero_venta}",
                    referencia=numero_venta,
                    usuario_id=current_user.id
                )
                db.add(mov)

    # Generación automática de Factura oficial asociada
    invoice_count = db.query(Invoice).count() + 1
    numero_factura = f"FACT-{current_year}-{invoice_count:05d}"
    new_invoice = Invoice(
        numero_factura=numero_factura,
        venta_id=new_sale.id,
        cliente_id=cliente_id,
        subtotal=subtotal_acum,
        impuestos=impuestos,
        descuento=descuento_general,
        total=total,
        estado="Emitida",
        notas=f"Generada automáticamente desde {numero_venta}"
    )
    db.add(new_invoice)
    db.flush()

    for d in detalles_to_insert:
        inv_detail = InvoiceDetail(
            factura_id=new_invoice.id,
            tipo_item=d["tipo_item"],
            item_id=d["producto_id"] or d["servicio_id"],
            descripcion=d["nombre_item"],
            cantidad=d["cantidad"],
            precio_unitario=d["precio_unitario"],
            subtotal=d["subtotal"]
        )
        db.add(inv_detail)

    db.commit()
    db.refresh(new_sale)
    db.refresh(new_invoice)

    return {
        "success": True,
        "message": "¡Venta y factura comercial registradas con éxito!",
        "venta": _format_sale(new_sale),
        "factura": {
            "id": new_invoice.id,
            "numero_factura": new_invoice.numero_factura,
            "total": new_invoice.total
        }
    }

@router.get("", summary="Consultar historial de ventas con filtros avanzados")
def get_sales_history(
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    cliente_id: Optional[int] = None,
    estado: Optional[str] = None,
    producto_id: Optional[int] = None,
    servicio_id: Optional[int] = None,
    valor_min: Optional[float] = None,
    valor_max: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Sale)

    # Si es cliente, solo ve sus propias compras
    if current_user.rol_id == 3:
        query = query.filter(Sale.cliente_id == current_user.id)
    elif cliente_id:
        query = query.filter(Sale.cliente_id == cliente_id)

    if estado:
        query = query.filter(Sale.estado == estado)
    if valor_min is not None:
        query = query.filter(Sale.total >= valor_min)
    if valor_max is not None:
        query = query.filter(Sale.total <= valor_max)
    if fecha_inicio:
        try:
            fi = datetime.strptime(fecha_inicio, "%Y-%m-%d")
            query = query.filter(Sale.fecha_hora >= fi)
        except ValueError:
            pass
    if fecha_fin:
        try:
            ff = datetime.strptime(f"{fecha_fin} 23:59:59", "%Y-%m-%d %H:%M:%S")
            query = query.filter(Sale.fecha_hora <= ff)
        except ValueError:
            pass

    if producto_id or servicio_id:
        query = query.join(Sale.detalles)
        if producto_id:
            query = query.filter(SaleDetail.producto_id == producto_id)
        if servicio_id:
            query = query.filter(SaleDetail.servicio_id == servicio_id)
        query = query.distinct()

    sales = query.order_by(Sale.id.desc()).all()
    formatted = [_format_sale(s) for s in sales]

    return {
        "success": True,
        "count": len(formatted),
        "sales": formatted
    }

@router.get("/daily", summary="Reporte diario de ventas para una fecha determinada")
def get_daily_sales_report(
    fecha: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador", "Empleado"]))
):
    target_date_str = fecha or datetime.now().strftime("%Y-%m-%d")
    try:
        t_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Utilice YYYY-MM-DD.")

    start_dt = datetime.combine(t_date, datetime.min.time())
    end_dt = datetime.combine(t_date, datetime.max.time())

    sales = db.query(Sale).filter(
        or_(
            and_(Sale.fecha_hora >= start_dt, Sale.fecha_hora <= end_dt),
            func.date(Sale.fecha_hora) == target_date_str
        )
    ).order_by(Sale.id.asc()).all()

    # Si no se especificó fecha y no hay ventas en el día estricto (por desfase UTC), tomar las ventas más recientes
    if not sales and not fecha:
        sales = db.query(Sale).order_by(Sale.id.desc()).limit(20).all()


    total_sales_count = len(sales)
    total_revenue = sum(s.total for s in sales)
    total_tax = sum(s.impuestos for s in sales)
    total_subtotal = sum(s.subtotal for s in sales)
    total_discounts = sum(s.descuento for s in sales)

    formatted_sales = [_format_sale(s) for s in sales]

    return {
        "success": True,
        "fecha": target_date_str,
        "resumen": {
            "total_ventas": total_sales_count,
            "subtotal": total_subtotal,
            "descuentos": total_discounts,
            "impuestos": total_tax,
            "total_recaudado": total_revenue
        },
        "ventas": formatted_sales
    }

@router.get("/{id}", summary="Consultar detalle de una venta por ID")
def get_sale_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sale = db.query(Sale).filter(Sale.id == id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada.")

    if current_user.rol_id == 3 and sale.cliente_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tiene permisos para ver esta venta.")

    return {
        "success": True,
        "venta": _format_sale(sale)
    }
