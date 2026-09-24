import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def print_step(title):
    print(f"\n{'='*70}\n[TEST] {title}\n{'='*70}")

def test_suite():
    print("Iniciando batería de pruebas automáticas del Quinto Avance en FastAPI...")

    # 1. Health Check
    print_step("1. Verificando estado de salud de la API (Health Check)")
    r = requests.get(f"{BASE_URL}/health")
    assert r.status_code == 200, f"Error en health check: {r.text}"
    health = r.json()
    print("Respuesta:", json.dumps(health, indent=2))
    assert health["version"] == "5.0.0", "La versión de la API debe ser 5.0.0"

    # 2. Login de Administrador y Cliente
    print_step("2. Autenticación JWT de Administrador y Cliente")
    admin_login = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@nexusgames.com",
        "password": "Admin123*"
    })
    assert admin_login.status_code == 200, f"Error login admin: {admin_login.text}"
    admin_token = admin_login.json()["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("Admin autenticado correctamente con JWT.")

    client_login = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "cliente@nexusgames.com",
        "password": "Cliente123*"
    })
    assert client_login.status_code == 200, f"Error login cliente: {client_login.text}"
    client_token = client_login.json()["token"]
    client_headers = {"Authorization": f"Bearer {client_token}"}
    print("Cliente autenticado correctamente con JWT.")

    # 3. Estadísticas del Dashboard Administrativo
    print_step("3. Consultando KPIs del Dashboard Administrativo (/api/roles/stats)")
    r_stats = requests.get(f"{BASE_URL}/roles/stats", headers=admin_headers)
    assert r_stats.status_code == 200, f"Error en stats: {r_stats.text}"
    stats = r_stats.json()["stats"]
    print("KPIs calculados dinámicamente:")
    print(f"  • Usuarios Totales: {stats['totalUsers']}")
    print(f"  • Ventas Comerciales: {stats['totalSales']}")
    print(f"  • Facturación Acumulada: ${stats['totalRevenue']:,.2f} COP")
    print(f"  • Facturas Emitidas: {stats['totalInvoices']}")
    print(f"  • PQR Recibidas: {stats['pqrReceived']}")
    print(f"  • PQR Pendientes: {stats['pqrPending']}")
    assert "totalSales" in stats and "pqrReceived" in stats, "Faltan métricas del quinto avance en stats"

    # 4. Registrar Nueva Venta Comercial (Producto + Servicio + Impuestos + Descuento)
    print_step("4. Registrando una venta combinada (Producto + Servicio) desde el sitio web")
    new_sale_payload = {
        "items": [
            {
                "tipo": "Producto",
                "id": 1,
                "nombre": "Cyberpunk 2077: Phantom Liberty",
                "cantidad": 2,
                "precio": 219900.0,
                "descuento": 10000.0
            },
            {
                "tipo": "Servicio",
                "id": 2,
                "nombre": "Ensamblaje y Optimización de PC Gamer Custom",
                "cantidad": 1,
                "precio": 180000.0,
                "descuento": 0.0
            }
        ],
        "metodo_pago": "Tarjeta de Crédito Online",
        "descuento_general": 5000.0,
        "notas": "Venta de prueba automatizada Quinto Avance"
    }
    r_sale = requests.post(f"{BASE_URL}/sales", json=new_sale_payload, headers=client_headers)
    assert r_sale.status_code == 201, f"Error creando venta: {r_sale.text}"
    sale_data = r_sale.json()
    print("Venta registrada con éxito:")
    print(f"  • Número de Venta: {sale_data['venta']['numero_venta']}")
    print(f"  • Subtotal: ${sale_data['venta']['subtotal']:,.2f} COP")
    print(f"  • Impuestos (IVA 19%): ${sale_data['venta']['impuestos']:,.2f} COP")
    print(f"  • Total: ${sale_data['venta']['total']:,.2f} COP")
    print(f"  • Factura Asociada: {sale_data['factura']['numero_factura']}")

    # 5. Historial de Ventas con Filtros
    print_step("5. Consultando historial de ventas con filtros avanzados")
    r_hist = requests.get(f"{BASE_URL}/sales?estado=Completada", headers=admin_headers)
    assert r_hist.status_code == 200, f"Error en historial: {r_hist.text}"
    sales_list = r_hist.json()["sales"]
    print(f"Total ventas encontradas: {len(sales_list)}")

    # 6. Reporte Diario de Ventas
    print_step("6. Consultando Reporte Diario de Ventas (/api/sales/daily)")
    r_daily = requests.get(f"{BASE_URL}/sales/daily", headers=admin_headers)
    assert r_daily.status_code == 200, f"Error en reporte diario: {r_daily.text}"
    daily = r_daily.json()
    print(f"Reporte del día {daily['fecha']}:")
    print(f"  • Total Ventas: {daily['resumen']['total_ventas']}")
    print(f"  • Total Recaudado: ${daily['resumen']['total_recaudado']:,.2f} COP")

    # 7. Consulta de Facturas y Búsqueda
    print_step("7. Consultando y buscando facturas comerciales (/api/invoices)")
    r_inv = requests.get(f"{BASE_URL}/invoices", headers=admin_headers)
    assert r_inv.status_code == 200, f"Error en facturas: {r_inv.text}"
    invoices = r_inv.json()["invoices"]
    print(f"Total facturas registradas: {len(invoices)}")
    first_inv = invoices[0]
    print(f"  • Primera factura: {first_inv['numero_factura']} - Cliente: {first_inv['cliente_nombre']} - Total: ${first_inv['total']:,.2f}")

    # 8. Módulo de PQR: Radicar PQR como Cliente
    print_step("8. Radicando nueva solicitud PQR como Cliente (/api/pqr)")
    new_pqr_payload = {
        "tipo": "Petición",
        "asunto": "Solicitud de catálogo de fuentes de poder modulares 850W",
        "descripcion": "Quisiera solicitar la disponibilidad de fuentes modulares con certificación 80 Plus Gold para ensamble gamer."
    }
    r_pqr = requests.post(f"{BASE_URL}/pqr", json=new_pqr_payload, headers=client_headers)
    assert r_pqr.status_code == 201, f"Error creando PQR: {r_pqr.text}"
    pqr_info = r_pqr.json()["pqr"]
    radicado = pqr_info["radicado"]
    pqr_id = pqr_info["id"]
    print(f"PQR radicada con radicado: {radicado} - Estado: {pqr_info['estado']}")

    # 9. Seguimiento de PQR por radicado (público)
    print_step("9. Seguimiento público de PQR mediante Radicado (/api/pqr/track/{radicado})")
    r_track = requests.get(f"{BASE_URL}/pqr/track/{radicado}")
    assert r_track.status_code == 200, f"Error en seguimiento: {r_track.text}"
    print("Seguimiento verificado:", r_track.json()["pqr"]["asunto"], "Estado:", r_track.json()["pqr"]["estado"])

    # 10. Responder y actualizar estado de PQR como Administrador
    print_step("10. Respuesta y cambio de estado de PQR como Administrador")
    r_resp = requests.patch(f"{BASE_URL}/pqr/{pqr_id}/respond", json={
        "estado": "Respondida",
        "respuesta": "Estimado cliente, tenemos disponibles fuentes Corsair RM850x y ASUS TUF 850W Gold en stock con garantía de 5 años."
    }, headers=admin_headers)
    assert r_resp.status_code == 200, f"Error respondiendo PQR: {r_resp.text}"
    print(f"PQR {radicado} actualizada a: {r_resp.json()['pqr']['estado']}")

    # 11. Chatbot Inteligente con IA
    print_step("11. Interacción con el Chatbot Inteligente con IA (/api/chatbot/message)")
    chat_payload = {
        "message": "¿Qué servicios técnicos ofrecen para mantenimiento y armado de computadores gamer?",
        "session_id": "test_session_automated"
    }
    r_chat = requests.post(f"{BASE_URL}/chatbot/message", json=chat_payload)
    assert r_chat.status_code == 200, f"Error en chatbot: {r_chat.text}"
    chat_resp = r_chat.json()
    print("Respuesta del Chatbot:")
    print(f"  • Origen: {chat_resp['source']}")
    print(f"  • Mensaje: {chat_resp['reply']}")
    print(f"  • Sugerencias: {chat_resp.get('suggestions', [])}")

    print("\n" + "="*70)
    print("¡TODAS LAS PRUEBAS DEL QUINTO AVANCE PASARON EXITOSAMENTE (100% OK)!")
    print("="*70)

if __name__ == "__main__":
    try:
        test_suite()
    except Exception as e:
        print(f"\n[ERROR EN PRUEBA]: {e}")
        sys.exit(1)
