from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from ..database import get_db
from ..models import (
    Role, Permission, RolePermission, User, Product, TechnicalService,
    Order, OrderDetail, Sale, SaleDetail, Invoice, PQR, Supplier, Purchase, InventoryMovement
)

router = APIRouter(prefix="/api/roles", tags=["Roles, Permisos y Estadísticas"])

@router.get("", summary="Consultar todos los roles con sus permisos")
def get_all_roles(db: Session = Depends(get_db)):
    roles = db.query(Role).order_by(Role.id.asc()).all()
    permissions = db.query(Permission).order_by(Permission.modulo.asc(), Permission.id.asc()).all()
    role_perms = db.query(RolePermission).all()

    formatted_roles = []
    for r in roles:
        assigned_perm_ids = [rp.permiso_id for rp in role_perms if rp.rol_id == r.id]
        role_p = [
            {"id": p.id, "codigo": p.codigo, "nombre": p.nombre, "modulo": p.modulo, "descripcion": p.descripcion}
            for p in permissions if p.id in assigned_perm_ids
        ]
        formatted_roles.append({
            "id": r.id,
            "nombre": r.nombre,
            "descripcion": r.descripcion,
            "permisos": role_p
        })

    all_permissions = [
        {"id": p.id, "codigo": p.codigo, "nombre": p.nombre, "modulo": p.modulo, "descripcion": p.descripcion}
        for p in permissions
    ]

    return {
        "success": True,
        "roles": formatted_roles,
        "todos_los_permisos": all_permissions
    }

@router.get("/stats", summary="Estadísticas generales reales calculadas desde la base de datos")
def get_dashboard_stats(db: Session = Depends(get_db)):
    # 1. Usuarios
    total_users = db.query(User).count()
    total_clients = db.query(User).filter(User.rol_id == 3).count()
    total_employees = db.query(User).filter(User.rol_id == 2).count()
    total_admins = db.query(User).filter(User.rol_id == 1).count()

    # 2. Productos e Inventario
    products = db.query(Product).all()
    total_products = len(products)
    low_stock = sum(1 for p in products if p.stock <= 5)
    total_stock_units = sum(p.stock for p in products)
    inventory_valuation = float(sum(p.stock * p.precio for p in products))

    # 3. Servicios Técnicos
    total_services = db.query(TechnicalService).count()

    # 4. Pedidos por Estado
    total_orders = db.query(Order).count()
    orders_pending = db.query(Order).filter(Order.estado == "Pendiente").count()
    orders_in_process = db.query(Order).filter(Order.estado == "En proceso").count()
    orders_completed = db.query(Order).filter(Order.estado == "Completada").count()
    orders_cancelled = db.query(Order).filter(Order.estado == "Cancelada").count()

    # 5. Ventas y Facturación
    total_sales = db.query(Sale).filter(Sale.estado != "Cancelada").count()
    sales_revenue = db.query(func.coalesce(func.sum(Sale.total), 0.0)).filter(Sale.estado != "Cancelada").scalar()
    total_invoices = db.query(Invoice).filter(Invoice.estado != "Anulada").count()

    # 6. Proveedores y Compras
    total_suppliers = db.query(Supplier).count()
    total_purchases = db.query(Purchase).filter(Purchase.estado != "Anulada").count()
    purchases_expenses = db.query(func.coalesce(func.sum(Purchase.total), 0.0)).filter(Purchase.estado != "Anulada").scalar()

    # 7. Balance Financiero
    total_revenue = float(sales_revenue or 0.0)
    total_expenses = float(purchases_expenses or 0.0)
    net_profit = round(total_revenue - total_expenses, 2)

    # 8. PQR
    pqr_received = db.query(PQR).count()
    pqr_pending = db.query(PQR).filter(PQR.estado == "Pendiente").count()
    pqr_in_process = db.query(PQR).filter(PQR.estado == "En Proceso").count()
    pqr_resolved = db.query(PQR).filter(PQR.estado.in_(["Respondida", "Cerrada"])).count()

    # 9. Top 5 Productos más Vendidos (Calculado desde OrderDetail / SaleDetail)
    top_selling_raw = (
        db.query(
            OrderDetail.producto_id,
            Product.nombre,
            Product.imagen,
            func.sum(OrderDetail.cantidad).label("total_vendido"),
            func.sum(OrderDetail.subtotal).label("total_recaudado")
        )
        .join(Product, OrderDetail.producto_id == Product.id)
        .join(Order, OrderDetail.pedido_id == Order.id)
        .filter(Order.estado != "Cancelada")
        .group_by(OrderDetail.producto_id, Product.nombre, Product.imagen)
        .order_by(desc("total_vendido"))
        .limit(5)
        .all()
    )

    top_products = [
        {
            "producto_id": row.producto_id,
            "nombre": row.nombre,
            "imagen": row.imagen,
            "total_vendido": int(row.total_vendido or 0),
            "total_recaudado": float(row.total_recaudado or 0.0)
        }
        for row in top_selling_raw
    ]

    return {
        "success": True,
        "stats": {
            "totalUsers": total_users,
            "totalClients": total_clients,
            "totalEmployees": total_employees,
            "totalAdmins": total_admins,
            "totalProducts": total_products,
            "lowStockProducts": low_stock,
            "totalStockUnits": total_stock_units,
            "inventoryValuation": inventory_valuation,
            "totalServices": total_services,
            "totalOrders": total_orders,
            "ordersPending": orders_pending,
            "ordersInProcess": orders_in_process,
            "ordersCompleted": orders_completed,
            "ordersCancelled": orders_cancelled,
            "totalSales": total_sales,
            "totalInvoices": total_invoices,
            "totalSuppliers": total_suppliers,
            "totalPurchases": total_purchases,
            "totalRevenue": total_revenue,
            "totalExpenses": total_expenses,
            "netProfit": net_profit,
            "pqrReceived": pqr_received,
            "pqrPending": pqr_pending,
            "pqrInProcess": pqr_in_process,
            "pqrResolved": pqr_resolved,
            "topProducts": top_products
        }
    }
