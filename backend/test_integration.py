import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.utils.security import create_access_token

def run_tests():
    client = TestClient(app)
    
    print("=== TEST 1: Healthcheck ===")
    res = client.get("/api/health")
    assert res.status_code == 200, f"Failed health: {res.text}"
    print(f"[OK] Healthcheck: {res.json()['status']}")

    # Login / Token de Administrador
    admin_token = create_access_token({"id": 1, "email": "admin@nexus.com", "rol": "Administrador"})
    auth_headers = {"Authorization": f"Bearer {admin_token}"}

    print("\n=== TEST 2: Estadísticas Reales de Roles / Finanzas ===")
    res = client.get("/api/roles/stats", headers=auth_headers)
    assert res.status_code == 200, f"Failed stats: {res.text}"
    stats = res.json()["stats"]
    print(f"[OK] Stats calculadas: Ventas=${stats['totalRevenue']}, Compras=${stats['totalExpenses']}, Margen=${stats['netProfit']}, Proveedores={stats['totalSuppliers']}")

    print("\n=== TEST 3: Catálogo de Productos y Stock ===")
    res = client.get("/api/products")
    assert res.status_code == 200
    products = res.json()["products"]
    assert len(products) > 0, "No products found"
    first_prod = products[0]
    initial_stock = first_prod["stock"]
    print(f"[OK] Total productos: {len(products)}, Producto '{first_prod['nombre']}' stock inicial: {initial_stock}")

    print("\n=== TEST 4: Proveedores y Registro de Compra (Incrementa Stock + Kardex) ===")
    res = client.get("/api/purchases/suppliers", headers=auth_headers)
    assert res.status_code == 200, f"Failed suppliers: {res.text}"
    suppliers = res.json()["suppliers"]
    assert len(suppliers) > 0, "No suppliers found"
    supp_id = suppliers[0]["id"]

    purchase_payload = {
        "proveedor_id": supp_id,
        "items": [
            {"producto_id": first_prod["id"], "cantidad": 5, "precio_costo_unitario": 50000}
        ],
        "metodo_pago": "Transferencia",
        "notas": "Compra prueba de integración"
    }
    res = client.post("/api/purchases", json=purchase_payload, headers=auth_headers)
    assert res.status_code == 201, f"Purchase failed: {res.text}"
    print(f"[OK] Compra creada: {res.json()['compra']['numero_compra']}")

    # Verificar aumento de stock
    res = client.get(f"/api/products/{first_prod['id']}")
    stock_after_purchase = res.json()["product"]["stock"]
    assert stock_after_purchase == initial_stock + 5, f"Expected {initial_stock + 5}, got {stock_after_purchase}"
    print(f"[OK] Stock incrementado de {initial_stock} a {stock_after_purchase}")

    print("\n=== TEST 5: Creación de Pedido (Checkout Atómico: Descuenta Stock, Crea Venta y Factura) ===")
    order_payload = {
        "total": float(first_prod["precio"]) * 2,
        "metodo_pago": "Tarjeta de Crédito",
        "direccion_envio": "Carrera 7 # 72-10",
        "estado": "Pendiente",
        "notas": "Pedido de prueba de integración",
        "items": [
            {"id": first_prod["id"], "quantity": 2, "precio": first_prod["precio"]}
        ]
    }
    
    res = client.post("/api/orders", json=order_payload, headers=auth_headers)
    assert res.status_code == 201, f"Checkout failed: {res.text}"
    order_data = res.json()["order"]
    order_id = order_data["id"]
    print(f"[OK] Pedido creado #{order_id} con Factura: {order_data.get('numero_factura')} y Venta: {order_data.get('numero_venta')}")

    # Verificar reducción de stock
    res = client.get(f"/api/products/{first_prod['id']}")
    stock_after_order = res.json()["product"]["stock"]
    assert stock_after_order == stock_after_purchase - 2, f"Expected {stock_after_purchase - 2}, got {stock_after_order}"
    print(f"[OK] Stock descontado por venta: {stock_after_purchase} -> {stock_after_order}")

    print("\n=== TEST 6: Transición Estricta de Estados de Pedidos ===")
    # Pendiente -> En proceso (Valido)
    res = client.patch(f"/api/orders/{order_id}/status", json={"estado": "En proceso"}, headers=auth_headers)
    assert res.status_code == 200, f"Transition failed: {res.text}"
    print(f"[OK] Transición a 'En proceso' exitosa")

    # En proceso -> Pendiente (Inválido, debe rechazar 400)
    res = client.patch(f"/api/orders/{order_id}/status", json={"estado": "Pendiente"}, headers=auth_headers)
    assert res.status_code == 400, f"Expected 400 on backward transition, got: {res.status_code}"
    print(f"[OK] Transición retroactiva rechazada con HTTP 400 correctamente")

    # En proceso -> Cancelada (Reincorpora Stock)
    res = client.patch(f"/api/orders/{order_id}/status", json={"estado": "Cancelada", "motivo_cancelacion": "Cancelación de prueba"}, headers=auth_headers)
    assert res.status_code == 200, f"Cancellation failed: {res.text}"
    print(f"[OK] Pedido cancelado exitosamente")

    # Verificar restauración de stock por cancelación
    res = client.get(f"/api/products/{first_prod['id']}")
    stock_after_cancel = res.json()["product"]["stock"]
    assert stock_after_cancel == stock_after_order + 2, f"Expected {stock_after_order + 2}, got {stock_after_cancel}"
    print(f"[OK] Stock reincorporado automáticamente: {stock_after_order} -> {stock_after_cancel}")

    print("\n=== TEST 7: Kardex y Movimientos Auditados ===")
    res = client.get("/api/inventory/movements", headers=auth_headers)
    assert res.status_code == 200
    movements = res.json()["movements"]
    assert len(movements) >= 3
    print(f"[OK] Total movimientos en Kardex: {len(movements)}")
    print(f"     Últimos movimientos: {[m['tipo_movimiento'] for m in movements[:3]]}")

    print("\n=== TEST 8: Resumen de Inventario / Valorización ===")
    res = client.get("/api/inventory/summary", headers=auth_headers)
    assert res.status_code == 200
    summary = res.json()["summary"]
    print(f"[OK] Valorización: {summary['unidades_totales']} unidades valoradas en ${summary['valor_total_inventario']} COP")

    print("\n============================================================")
    print("TODOS LOS FLUJOS REALES Y TRANSACCIONALES PASARON CON ÉXITO")
    print("============================================================")

if __name__ == "__main__":
    run_tests()
