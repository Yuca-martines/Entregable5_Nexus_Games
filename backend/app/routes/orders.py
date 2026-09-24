from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..models import Order, OrderDetail, Product, User, Sale, SaleDetail, Invoice, InvoiceDetail, InventoryMovement
from ..schemas import OrderCreate, OrderStatusUpdate
from ..dependencies import get_current_user, require_role

router = APIRouter(prefix="/api/orders", tags=["Pedidos y Ventas"])

ORDER_STATUS_FLOW = {
    "Pendiente": {"En proceso", "Cancelada"},
    "En proceso": {"Completada", "Cancelada"},
    "Completada": set(),
    "Cancelada": set(),
}

def _normalize_status(status: str | None) -> str:
    if not status:
        return "Pendiente"
    normalized = str(status).strip()
    legacy_map = {
        "En Proceso": "En proceso",
        "Completado": "Completada",
        "Cancelado": "Cancelada",
    }
    return legacy_map.get(normalized, normalized)

def _is_valid_transition(current_status: str, next_status: str) -> bool:
    current = _normalize_status(current_status)
    target = _normalize_status(next_status)
    if not current or current == target:
        return True
    allowed = ORDER_STATUS_FLOW.get(current, set())
    return target in allowed

def _format_order(o: Order) -> dict:
    items = []
    for item in o.items:
        items.append({
            "id": item.id,
            "producto_id": item.producto_id,
            "producto_nombre": item.producto.nombre if item.producto else "Producto",
            "producto_imagen": item.producto.imagen if item.producto else "",
            "cantidad": item.cantidad,
            "precio_unitario": item.precio_unitario,
            "subtotal": item.subtotal
        })

    # Información de factura y venta asociada por relación de BD
    factura_id = None
    numero_factura = None
    factura_estado = None
    if o.venta and o.venta.factura:
        factura_id = o.venta.factura.id
        numero_factura = o.venta.factura.numero_factura
        factura_estado = o.venta.factura.estado

    return {
        "id": o.id,
        "usuario_id": o.usuario_id,
        "cliente_nombre": o.usuario.nombre if o.usuario else "Cliente",
        "cliente_apellido": o.usuario.apellido if o.usuario else "",
        "cliente_documento": f"{o.usuario.tipo_documento} {o.usuario.numero_documento}" if o.usuario else "N/A",
        "cliente_email": o.usuario.email if o.usuario else "",
        "total": o.total,
        "metodo_pago": o.metodo_pago,
        "estado": _normalize_status(o.estado),
        "direccion_envio": o.direccion_envio,
        "motivo_cancelacion": o.motivo_cancelacion,
        "notas": o.notas,
        "fecha_proceso": o.fecha_proceso,
        "fecha_entrega": o.fecha_entrega,
        "creado_en": o.creado_en,
        "venta_id": o.venta.id if o.venta else None,
        "numero_venta": o.venta.numero_venta if o.venta else None,
        "factura_id": factura_id,
        "numero_factura": numero_factura,
        "factura_estado": factura_estado,
        "items": items
    }

@router.post("", status_code=status.HTTP_201_CREATED, summary="Crear un nuevo pedido con flujo completo y transaccional")
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not order_data.items or len(order_data.items) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El pedido debe contener al menos un producto."
        )

    estado = _normalize_status(order_data.estado or "Pendiente")
    if estado not in {"Pendiente", "En proceso", "Cancelada"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El estado inicial del pedido solo puede ser Pendiente o En proceso."
        )

    # 1. Validar existencia y stock de todos los productos
    items_to_process = []
    subtotal_calculado = 0.0

    for item in order_data.items:
        product = db.query(Product).filter(Product.id == item.id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"El producto con ID {item.id} no existe en el catálogo."
            )

        if product.estado != "Activo":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El producto '{product.nombre}' no se encuentra activo para la venta."
            )

        if item.quantity > product.stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stock insuficiente para '{product.nombre}'. Disponible: {product.stock}, Solicitado: {item.quantity}."
            )

        unit_price = float(item.precio if item.precio is not None else (item.price if item.price is not None else product.precio))
        subtotal_item = round(unit_price * item.quantity, 2)
        subtotal_calculado += subtotal_item

        items_to_process.append({
            "product": product,
            "quantity": item.quantity,
            "unit_price": unit_price,
            "subtotal": subtotal_item,
            "stock_anterior": product.stock
        })

    # Calcular impuestos y total real
    impuestos = round(subtotal_calculado * 0.19, 2)
    total_real = round(subtotal_calculado + impuestos, 2)

    # Si se envió un total y coincide aproximadamente, usamos los cálculos del sistema
    final_total = total_real if abs(order_data.total - total_real) < 1.0 else order_data.total

    # 2. Insertar el Pedido
    new_order = Order(
        usuario_id=current_user.id,
        total=final_total,
        metodo_pago=order_data.metodo_pago or "Tarjeta de Crédito / PSE",
        estado=estado,
        direccion_envio=order_data.direccion_envio or current_user.direccion or "Dirección registrada",
        notas=order_data.notas,
        motivo_cancelacion=order_data.motivo_cancelacion,
        fecha_proceso=datetime.now() if estado == "En proceso" else None,
        fecha_entrega=None
    )
    db.add(new_order)
    db.flush()

    # 3. Insertar Detalles de Pedido, Descontar Stock y Asentar Kardex
    for it in items_to_process:
        prod = it["product"]
        cant = it["quantity"]
        stock_ant = it["stock_anterior"]
        stock_nuevo = stock_ant - cant

        # Detalle de Pedido
        detail = OrderDetail(
            pedido_id=new_order.id,
            producto_id=prod.id,
            cantidad=cant,
            precio_unitario=it["unit_price"],
            subtotal=it["subtotal"]
        )
        db.add(detail)

        # Actualizar stock en BD
        prod.stock = stock_nuevo

        # Kardex
        mov = InventoryMovement(
            producto_id=prod.id,
            tipo_movimiento="SALIDA_VENTA",
            cantidad=-cant,
            stock_anterior=stock_ant,
            stock_nuevo=stock_nuevo,
            motivo=f"Venta Pedido #{new_order.id} al cliente {current_user.nombre}",
            referencia=f"Pedido #{new_order.id}",
            usuario_id=current_user.id
        )
        db.add(mov)

    # 4. Crear Venta Comercial y Factura Electrónica vinculada 1:1
    current_year = datetime.now().year
    sale_count = db.query(Sale).count() + 1
    numero_venta = f"VENT-{current_year}-{sale_count:05d}"

    new_sale = Sale(
        numero_venta=numero_venta,
        cliente_id=current_user.id,
        usuario_operacion_id=current_user.id if current_user.rol_id in [1, 2] else None,
        pedido_id=new_order.id,
        subtotal=subtotal_calculado,
        descuento=0.0,
        impuestos=impuestos,
        total=final_total,
        metodo_pago=new_order.metodo_pago,
        estado="Completada" if estado != "Cancelada" else "Cancelada",
        notas=f"Generada desde pedido web #{new_order.id}"
    )
    db.add(new_sale)
    db.flush()

    for it in items_to_process:
        s_detail = SaleDetail(
            venta_id=new_sale.id,
            tipo_item="Producto",
            producto_id=it["product"].id,
            servicio_id=None,
            nombre_item=it["product"].nombre,
            cantidad=it["quantity"],
            precio_unitario=it["unit_price"],
            descuento=0.0,
            subtotal=it["subtotal"]
        )
        db.add(s_detail)

    # 5. Factura Oficial
    inv_count = db.query(Invoice).count() + 1
    numero_factura = f"FACT-{current_year}-{inv_count:05d}"
    new_invoice = Invoice(
        numero_factura=numero_factura,
        venta_id=new_sale.id,
        cliente_id=current_user.id,
        pedido_id=new_order.id,
        subtotal=subtotal_calculado,
        impuestos=impuestos,
        descuento=0.0,
        total=final_total,
        estado="Emitida" if estado != "Cancelada" else "Anulada",
        notas=f"Factura generada automáticamente desde Pedido #{new_order.id}"
    )
    db.add(new_invoice)
    db.flush()

    for it in items_to_process:
        inv_detail = InvoiceDetail(
            factura_id=new_invoice.id,
            tipo_item="Producto",
            item_id=it["product"].id,
            descripcion=it["product"].nombre,
            cantidad=it["quantity"],
            precio_unitario=it["unit_price"],
            subtotal=it["subtotal"]
        )
        db.add(inv_detail)

    db.commit()
    db.refresh(new_order)
    db.refresh(new_sale)
    db.refresh(new_invoice)

    return {
        "success": True,
        "message": "¡Pedido, venta, movimiento de stock y factura registrados con éxito!",
        "orderId": new_order.id,
        "order": _format_order(new_order),
        "factura": {
            "id": new_invoice.id,
            "numero_factura": new_invoice.numero_factura,
            "total": new_invoice.total
        }
    }

@router.get("/my-orders", summary="Consultar pedidos del usuario autenticado")
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    orders = db.query(Order).filter(Order.usuario_id == current_user.id).order_by(Order.id.desc()).all()
    formatted = [_format_order(o) for o in orders]
    return {
        "success": True,
        "orders": formatted
    }

@router.patch("/{id}/status", summary="Actualizar estado de un pedido con validación estricta y reintegro de stock en cancelación")
def update_order_status(
    id: int,
    data: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador", "Empleado"]))
):
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado.")

    current = _normalize_status(order.estado)
    target = _normalize_status(data.estado)

    # Validar transiciones estrictas
    if current == "Completada":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede modificar un pedido que ya está en estado 'Completada'."
        )

    if current == "Cancelada":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede modificar un pedido que ya ha sido 'Cancelada'."
        )

    if not _is_valid_transition(current, target):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transición no permitida: {current} → {target}. Secuencia válida: Pendiente → En proceso → Completada, o cancelación directa desde Pendiente / En proceso."
        )

    # Si se cancela el pedido, reincorporamos el inventario de los productos de forma atómica
    if target == "Cancelada" and current != "Cancelada":
        for item in order.items:
            product = db.query(Product).filter(Product.id == item.producto_id).first()
            if product:
                stock_ant = product.stock
                product.stock += item.cantidad
                # Registro en Kardex de la anulación
                mov = InventoryMovement(
                    producto_id=product.id,
                    tipo_movimiento="ANULACION_PEDIDO",
                    cantidad=item.cantidad,
                    stock_anterior=stock_ant,
                    stock_nuevo=product.stock,
                    motivo=f"Reintegro por cancelación de Pedido #{order.id}: {data.motivo_cancelacion or 'Cancelado por administración'}",
                    referencia=f"Cancelación #{order.id}",
                    usuario_id=current_user.id
                )
                db.add(mov)

        # Actualizar venta y factura asociada si existen
        if order.venta:
            order.venta.estado = "Cancelada"
            if order.venta.factura:
                order.venta.factura.estado = "Anulada"

    order.estado = target
    if data.notas:
        order.notas = data.notas
    if target == "En proceso" and not order.fecha_proceso:
        order.fecha_proceso = datetime.now()
    if target == "Completada":
        order.fecha_entrega = order.fecha_entrega or datetime.now()
        if not order.fecha_proceso:
            order.fecha_proceso = datetime.now()
    if target == "Cancelada":
        order.motivo_cancelacion = data.motivo_cancelacion or order.motivo_cancelacion or "Pedido cancelado por revisión comercial."
    elif target != "Cancelada":
        order.motivo_cancelacion = None

    db.commit()
    db.refresh(order)

    return {
        "success": True,
        "message": f"Pedido #{order.id} actualizado a '{order.estado}'.",
        "order": _format_order(order)
    }

@router.get("/all", summary="Consultar todos los pedidos (Admin/Empleado)")
def get_all_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador", "Empleado"]))
):
    orders = db.query(Order).order_by(Order.id.desc()).all()
    formatted = [_format_order(o) for o in orders]
    return {
        "success": True,
        "count": len(formatted),
        "orders": formatted
    }
