import urllib.request
import urllib.error
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def request(method, path, data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            parsed = json.loads(err_body)
        except Exception:
            parsed = err_body
        return e.code, parsed

def run_tests():
    print("=========================================================")
    print("    EJECUTANDO PRUEBAS DE INTEGRACIÓN FASTAPI + SQL     ")
    print("=========================================================")
    errors = 0

    # 1. Health Check
    status, res = request("GET", "/api/health")
    assert status == 200 and res.get("status") == "online", f"Fallo Health Check: {status} {res}"
    print(" [1/13] Health check OK:", res.get("project"))

    # 2. Swagger Docs
    req = urllib.request.Request(f"{BASE_URL}/docs", method="GET")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200, "Fallo Swagger UI"
    print(" [2/13] Swagger UI disponible en http://127.0.0.1:8000/docs")

    # 3. Login Admin
    status, res = request("POST", "/api/auth/login", {"email": "admin@nexusgames.com", "password": "Admin123*"})
    assert status == 200 and "token" in res, f"Fallo login admin: {status} {res}"
    admin_token = res["token"]
    print(" [3/13] Login Admin exitoso con JWT generado.")

    # 4. Login Empleado & Cliente
    status, res_emp = request("POST", "/api/auth/login", {"email": "empleado@nexusgames.com", "password": "Empleado123*"})
    assert status == 200, "Fallo login empleado"
    status, res_cli = request("POST", "/api/auth/login", {"email": "cliente@nexusgames.com", "password": "Cliente123*"})
    assert status == 200, "Fallo login cliente"
    client_token = res_cli["token"]
    print(" [4/13] Login Empleado y Cliente exitosos.")

    # 5. Obtener Perfil con Token
    status, res = request("GET", "/api/auth/me", token=admin_token)
    assert status == 200 and res["user"]["email"] == "admin@nexusgames.com", f"Fallo perfil: {res}"
    print(f" [5/13] GET /api/auth/me verificado para usuario: {res['user']['nombre_completo']}")

    # 6. Protección de Endpoints: Sin Token -> 401
    status, res = request("GET", "/api/usuarios")
    assert status == 401, f"Se esperaba 401 sin token, se obtuvo: {status}"
    print(" [6/13] Endpoint protegido rechazó petición anónima con 401 Unauthorized.")

    # 7. Control de Roles: Cliente intentando acceder a /api/usuarios -> 403
    status, res = request("GET", "/api/usuarios", token=client_token)
    assert status == 403, f"Se esperaba 403 para cliente, se obtuvo: {status}"
    print(" [7/13] Control de Roles RBAC: Cliente denegado con 403 Forbidden para lista de usuarios.")

    # 8. Validaciones Pydantic Backend (Email inválido) -> 422
    invalid_user = {
        "nombre": "Juan",
        "apellido": "Perez",
        "tipo_documento": "CC",
        "numero_documento": "123456",
        "direccion": "Calle 1",
        "telefono": "123", # debe ser 10 digitos
        "email": "correo-invalido",
        "password": "123"
    }
    status, res = request("POST", "/api/usuarios/registro", invalid_user)
    assert status == 422, f"Se esperaba 422 por validación Pydantic, se obtuvo: {status}"
    print(" [8/13] Validación Backend con Pydantic: Datos inválidos rechazados con 422 Unprocessable Entity.")

    # 9. Registro de Nuevo Usuario
    new_user_data = {
        "nombre": "Mariana",
        "apellido": "Salazar",
        "tipo_documento": "CC",
        "numero_documento": "1087654321",
        "direccion": "Calle 72 # 11-45, Bogotá",
        "telefono": "3109876543",
        "email": "mariana.salazar@example.com",
        "password": "Mariana123*",
        "rol_id": 3
    }
    status, res = request("POST", "/api/usuarios/registro", new_user_data)
    assert status in (201, 400), f"Fallo registro: {status} {res}"
    print(" [9/13] Registro de Usuario en /api/usuarios/registro verificado exitosamente.")

    # 10. CRUD Usuarios (Admin)
    status, users_res = request("GET", "/api/usuarios", token=admin_token)
    assert status == 200 and users_res["count"] >= 3, "Fallo listado usuarios"
    print(f" [10/13] CRUD Usuarios: {users_res['count']} usuarios consultados con rol Administrador.")

    # 11. CRUD Productos & Stock
    status, prods_res = request("GET", "/api/productos")
    assert status == 200 and prods_res["count"] > 0, "Fallo consulta productos"
    
    # Crear producto nuevo
    new_prod = {
        "nombre": "Teclado Mecánico Inalámbrico Nexus Pro",
        "descripcion": "Teclado gamer 75% hot-swappable con interruptores lubricados y RGB.",
        "precio": 350000.0,
        "stock": 10,
        "categoria_id": 4,
        "plataforma": "PC / Mac",
        "destacado": 1
    }
    status, create_prod_res = request("POST", "/api/productos", new_prod, token=admin_token)
    assert status == 201, f"Fallo creación producto: {status} {create_prod_res}"
    prod_id = create_prod_res["productId"]

    # Ajustar stock
    status, stock_res = request("PATCH", f"/api/productos/{prod_id}/stock", {"delta": 5}, token=admin_token)
    assert status == 200 and stock_res["newStock"] == 15, "Fallo ajuste stock"

    # Actualizar producto
    status, update_prod_res = request("PUT", f"/api/productos/{prod_id}", {"precio": 320000.0}, token=admin_token)
    assert status == 200, "Fallo actualización producto"

    # Eliminar producto creado de prueba
    status, del_prod_res = request("DELETE", f"/api/productos/{prod_id}", token=admin_token)
    assert status == 200, "Fallo eliminación producto"
    print(" [11/13] CRUD Productos: GET, POST, PUT, PATCH Stock y DELETE verificados.")

    # 12. CRUD Servicios
    status, servs_res = request("GET", "/api/servicios")
    assert status == 200 and servs_res["count"] >= 3, "Fallo consulta servicios"
    new_serv = {
        "nombre": "Calibración y Optimización de Monitores OLED",
        "descripcion": "Perfilado de color profesional con colorímetro X-Rite para creadores y gamers.",
        "precio": 90000.0,
        "duracion_estimada": "12 Horas"
    }
    status, serv_create = request("POST", "/api/servicios", new_serv, token=admin_token)
    assert status == 201, "Fallo creación servicio"
    serv_id = serv_create["serviceId"]
    status, serv_del = request("DELETE", f"/api/servicios/{serv_id}", token=admin_token)
    assert status == 200, "Fallo eliminación servicio"
    print(" [12/13] CRUD Servicios: GET, POST, DELETE verificados correctamente.")

    # 13. Roles y Estadísticas
    status, roles_res = request("GET", "/api/roles")
    assert status == 200 and len(roles_res["roles"]) == 3, "Fallo consulta roles"
    status, stats_res = request("GET", "/api/roles/stats")
    assert status == 200 and "totalUsers" in stats_res["stats"], "Fallo estadísticas"
    print(f" [13/13] Estadísticas del Sistema: Usuarios={stats_res['stats']['totalUsers']}, Productos={stats_res['stats']['totalProducts']}, Pedidos={stats_res['stats']['totalOrders']}")

    print("\n=========================================================")
    print(" ¡TODAS LAS PRUEBAS (13/13) PASARON SATISFACTORIAMENTE! ")
    print("=========================================================")

if __name__ == "__main__":
    run_tests()
