import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

# Cargar variables de entorno desde backend/.env
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL", "")

# Si no hay DATABASE_URL definida, usar SQLite con ruta absoluta relativa al proyecto
if not DATABASE_URL:
    # Ruta absoluta: /app/database/database.sqlite dentro del contenedor Docker
    db_dir = BASE_DIR / "database"
    db_dir.mkdir(parents=True, exist_ok=True)
    db_path = db_dir / "database.sqlite"
    DATABASE_URL = f"sqlite:///{db_path.as_posix()}"

# Si DATABASE_URL viene de una variable de entorno con ruta relativa sqlite, resolverla en absoluta
elif DATABASE_URL.startswith("sqlite:///") and not DATABASE_URL.startswith("sqlite:////"):
    rel_path = DATABASE_URL.replace("sqlite:///", "")
    if not os.path.isabs(rel_path):
        abs_db_path = (BASE_DIR / rel_path).resolve()
        abs_db_path.parent.mkdir(parents=True, exist_ok=True)
        DATABASE_URL = f"sqlite:///{abs_db_path.as_posix()}"


# Configurar motor SQLAlchemy
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Generador de sesión de base de datos para inyección de dependencias en FastAPI."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """
    Inicializa las tablas de la base de datos relacional SQL y asegura
    que los datos semilla (roles, permisos, categorías y usuarios de prueba) existan.
    """
    from .models import (
        Role, Permission, RolePermission, User, Category, Product,
        TechnicalService, Order, OrderDetail, Sale, SaleDetail,
        Invoice, InvoiceDetail, PQR, Conversation, ChatMessage,
        Supplier, Purchase, PurchaseDetail, InventoryMovement
    )
    from .utils.security import hash_password

    # Crear todas las tablas declaradas si no existen
    Base.metadata.create_all(bind=engine)

    # Migración ligera y segura para columnas si la BD ya existe
    with engine.connect() as conn:
        # PRAGMA para pedidos
        try:
            columns = conn.execute(text("PRAGMA table_info('pedidos')")).fetchall()
            existing = {row[1] for row in columns}
            if 'notas' not in existing:
                conn.execute(text("ALTER TABLE pedidos ADD COLUMN notas TEXT"))
                conn.commit()
            if 'motivo_cancelacion' not in existing:
                conn.execute(text("ALTER TABLE pedidos ADD COLUMN motivo_cancelacion VARCHAR(255)"))
                conn.commit()
            if 'fecha_proceso' not in existing:
                conn.execute(text("ALTER TABLE pedidos ADD COLUMN fecha_proceso DATETIME"))
                conn.commit()
            if 'fecha_entrega' not in existing:
                conn.execute(text("ALTER TABLE pedidos ADD COLUMN fecha_entrega DATETIME"))
                conn.commit()
        except Exception as e:
            print(f"Migración pedidos info: {e}")

        # PRAGMA para ventas
        try:
            v_cols = conn.execute(text("PRAGMA table_info('ventas')")).fetchall()
            v_existing = {row[1] for row in v_cols}
            if 'pedido_id' not in v_existing:
                conn.execute(text("ALTER TABLE ventas ADD COLUMN pedido_id INTEGER REFERENCES pedidos(id)"))
                conn.commit()
        except Exception as e:
            print(f"Migración ventas info: {e}")

        # PRAGMA para facturas
        try:
            f_cols = conn.execute(text("PRAGMA table_info('facturas')")).fetchall()
            f_existing = {row[1] for row in f_cols}
            if 'pedido_id' not in f_existing:
                conn.execute(text("ALTER TABLE facturas ADD COLUMN pedido_id INTEGER REFERENCES pedidos(id)"))
                conn.commit()
        except Exception as e:
            print(f"Migración facturas info: {e}")

    # Verificar e insertar datos iniciales en la base de datos
    db = SessionLocal()
    try:
        # 1. ROLES
        if db.query(Role).count() == 0:
            roles_data = [
                Role(id=1, nombre="Administrador", descripcion="Acceso total al sistema, gestión de usuarios, productos, stock, roles y servicios"),
                Role(id=2, nombre="Empleado", descripcion="Gestión de productos, control y ajuste de stock, y visualización de pedidos y servicios"),
                Role(id=3, nombre="Cliente", descripcion="Consulta de catálogo, compras en línea, panel de perfil e historial de pedidos")
            ]
            db.add_all(roles_data)
            db.commit()

        # 2. PERMISOS
        if db.query(Permission).count() == 0:
            permisos_data = [
                Permission(id=1, codigo="USERS_CREATE", nombre="Crear Usuarios", modulo="Usuarios", descripcion="Permite registrar nuevos usuarios con cualquier rol"),
                Permission(id=2, codigo="USERS_READ", nombre="Ver Usuarios", modulo="Usuarios", descripcion="Permite consultar la lista de usuarios y detalles"),
                Permission(id=3, codigo="USERS_UPDATE", nombre="Editar Usuarios", modulo="Usuarios", descripcion="Permite modificar información de usuarios"),
                Permission(id=4, codigo="USERS_STATUS", nombre="Cambiar Estado de Usuario", modulo="Usuarios", descripcion="Permite activar o desactivar usuarios"),
                Permission(id=5, codigo="USERS_DELETE", nombre="Eliminar Usuarios", modulo="Usuarios", descripcion="Permite eliminar cuentas de usuario"),
                Permission(id=6, codigo="PRODUCTS_CREATE", nombre="Crear Productos", modulo="Productos", descripcion="Permite dar de alta nuevos productos"),
                Permission(id=7, codigo="PRODUCTS_READ", nombre="Ver Productos", modulo="Productos", descripcion="Permite consultar el catálogo completo de productos"),
                Permission(id=8, codigo="PRODUCTS_UPDATE", nombre="Editar Productos", modulo="Productos", descripcion="Permite actualizar datos de productos"),
                Permission(id=9, codigo="PRODUCTS_STOCK", nombre="Gestionar Stock", modulo="Productos", descripcion="Permite aumentar o disminuir inventario"),
                Permission(id=10, codigo="PRODUCTS_DELETE", nombre="Eliminar Productos", modulo="Productos", descripcion="Permite dar de baja productos"),
                Permission(id=11, codigo="SERVICES_MANAGE", nombre="Gestionar Servicios", modulo="Servicios", descripcion="Permite crear y actualizar servicios técnicos"),
                Permission(id=12, codigo="ORDERS_VIEW", nombre="Ver Pedidos", modulo="Ventas", descripcion="Permite consultar pedidos realizados")
            ]
            db.add_all(permisos_data)
            db.commit()

        # 3. ROL_PERMISOS
        if db.query(RolePermission).count() == 0:
            admin_perms = [RolePermission(rol_id=1, permiso_id=i) for i in range(1, 13)]
            emp_perms = [RolePermission(rol_id=2, permiso_id=i) for i in [2, 6, 7, 8, 9, 11, 12]]
            client_perms = [RolePermission(rol_id=3, permiso_id=7)]
            db.add_all(admin_perms + emp_perms + client_perms)
            db.commit()

        # 4. CATEGORÍAS
        if db.query(Category).count() == 0:
            cat_data = [
                Category(id=1, nombre="Videojuegos", descripcion="Juegos digitales y físicos para PC y consolas", icono="Gamepad2"),
                Category(id=2, nombre="Electrodomésticos Gamers", descripcion="Monitores, sillas ergonómicas, iluminación y audio", icono="Monitor"),
                Category(id=3, nombre="Componentes y Hardware", descripcion="Tarjetas gráficas, procesadores, memorias y fuentes", icono="Cpu"),
                Category(id=4, nombre="Accesorios y Periféricos", descripcion="Teclados mecánicos, ratones gamer y auriculares", icono="Headphones")
            ]
            db.add_all(cat_data)
            db.commit()

        # 5. PRODUCTOS INICIALES
        if db.query(Product).count() == 0:
            prods = [
                Product(id=1, nombre="Cyberpunk 2077: Phantom Liberty", descripcion="Sumérgete en la apasionante historia de espionaje en Night City con gráficos de última generación con Ray Tracing y DLSS 3.5.", precio=219900.0, stock=15, categoria_id=1, plataforma="PC / PS5 / Xbox Series", imagen="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000&auto=format&fit=crop", destacado=1, estado="Activo"),
                Product(id=2, nombre="Elden Ring: Shadow of the Erdtree", descripcion="Explora las Tierras Intermedias y el Reino de las Sombras en esta obra maestra del rol y acción desarrollada por FromSoftware.", precio=249900.0, stock=22, categoria_id=1, plataforma="Multiplataforma", imagen="https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1000&auto=format&fit=crop", destacado=1, estado="Activo"),
                Product(id=3, nombre="Monitor Gamer Curvo 27\" 240Hz QHD", descripcion="Monitor OLED de respuesta 0.03ms, HDR1000 y resolución 2560x1440 con sincronización G-Sync / FreeSync Premium.", precio=1850000.0, stock=8, categoria_id=2, plataforma="Periféricos", imagen="https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=1000&auto=format&fit=crop", destacado=1, estado="Activo"),
                Product(id=4, nombre="Tarjeta Gráfica RTX 4080 Super 16GB", descripcion="Máxima potencia para juegos en 4K y renderizado profesional con arquitectura Ada Lovelace y DLSS 3.", precio=4950000.0, stock=4, categoria_id=3, plataforma="Hardware PC", imagen="https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=1000&auto=format&fit=crop", destacado=1, estado="Activo"),
                Product(id=5, nombre="Teclado Mecánico Custom RGB Hot-Swap", descripcion="Switches lubricados de fábrica, estructura gasket mount, teclas PBT de doble inyección e iluminación RGB personalizable.", precio=380000.0, stock=25, categoria_id=4, plataforma="Accesorios", imagen="https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=1000&auto=format&fit=crop", destacado=0, estado="Activo"),
                Product(id=6, nombre="God of War Ragnarök", descripcion="Acompaña a Kratos y Atreus en un mítico viaje por los Nueve Reinos enfrentando al destino y los dioses nórdicos.", precio=239900.0, stock=18, categoria_id=1, plataforma="PS5 / PC", imagen="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1000&auto=format&fit=crop", destacado=1, estado="Activo"),
                Product(id=7, nombre="Silla Gamer Ergonómica Premium Black & Gold", descripcion="Soporte lumbar magnético 4D, espuma viscoelástica de alta densidad y acabado en cuero sintético reforzado.", precio=920000.0, stock=6, categoria_id=2, plataforma="Mobiliario", imagen="https://images.unsplash.com/photo-1598550476439-6847785fcea6?q=80&w=1000&auto=format&fit=crop", destacado=0, estado="Activo"),
                Product(id=8, nombre="Procesador AMD Ryzen 7 7800X3D", descripcion="El rey indiscutible en rendimiento para gaming con tecnología 3D V-Cache, 8 núcleos y 16 hilos.", precio=1980000.0, stock=10, categoria_id=3, plataforma="Hardware PC", imagen="https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=1000&auto=format&fit=crop", destacado=0, estado="Activo")
            ]
            db.add_all(prods)
            db.commit()

        # 6. SERVICIOS INICIALES
        if db.query(TechnicalService).count() == 0:
            servs = [
                TechnicalService(id=1, nombre="Mantenimiento Preventivo y Limpieza Profunda PC/Consola", descripcion="Desarme completo, limpieza por ultrasonido, cambio de pasta térmica de alto rendimiento y thermal pads.", precio=120000.0, duracion_estimada="24 - 48 Horas", icono="Wrench", estado="Activo"),
                TechnicalService(id=2, nombre="Ensamblaje y Optimización de PC Gamer Custom", descripcion="Montaje estético con gestión de cables oculta, configuración de BIOS, curvas de ventilación y pruebas de estrés.", precio=180000.0, duracion_estimada="24 Horas", icono="Cpu", estado="Activo"),
                TechnicalService(id=3, nombre="Diagnóstico y Reparación de Hardware", descripcion="Revisión exhaustiva con osciloscopio y cámaras térmicas para detectar fallas en placas base y tarjetas gráficas.", precio=80000.0, duracion_estimada="48 Horas", icono="Activity", estado="Activo")
            ]
            db.add_all(servs)
            db.commit()

        # 7. USUARIOS DE PRUEBA
        admin_user = db.query(User).filter(User.email == "admin@nexusgames.com").first()
        if not admin_user:
            admin_user = User(
                nombre="Administrador",
                apellido="Nexus",
                tipo_documento="CC",
                numero_documento="1000000001",
                direccion="Calle 100 # 15-20, Bogotá",
                telefono="3101234567",
                email="admin@nexusgames.com",
                password=hash_password("Admin123*"),
                rol_id=1,
                estado="Activo"
            )
            db.add(admin_user)

        emp_user = db.query(User).filter(User.email == "empleado@nexusgames.com").first()
        if not emp_user:
            emp_user = User(
                nombre="Carlos",
                apellido="Rodríguez",
                tipo_documento="CC",
                numero_documento="1000000002",
                direccion="Carrera 45 # 26-10, Medellín",
                telefono="3157891234",
                email="empleado@nexusgames.com",
                password=hash_password("Empleado123*"),
                rol_id=2,
                estado="Activo"
            )
            db.add(emp_user)

        client_user = db.query(User).filter(User.email == "cliente@nexusgames.com").first()
        if not client_user:
            client_user = User(
                nombre="Valentina",
                apellido="Gómez",
                tipo_documento="CC",
                numero_documento="1000000003",
                direccion="Avenida 6N # 28-40, Cali",
                telefono="3209876543",
                email="cliente@nexusgames.com",
                password=hash_password("Cliente123*"),
                rol_id=3,
                estado="Activo"
            )
            db.add(client_user)

        db.commit()

        # 8. SEMILLAS DE PQR (QUINTO AVANCE)
        if db.query(PQR).count() == 0:
            pqrs_data = [
                PQR(
                    id=1,
                    radicado="PQR-2026-00001",
                    usuario_id=client_user.id if client_user else 3,
                    cliente_nombre="Valentina Gómez",
                    cliente_email="cliente@nexusgames.com",
                    cliente_telefono="3209876543",
                    tipo="Petición",
                    asunto="Consulta sobre garantía de tarjeta gráfica RTX 4080",
                    descripcion="Deseo conocer los términos y cobertura del fabricante para la garantía de 12 meses de componentes de hardware.",
                    estado="Respondida",
                    respuesta="Apreciada Valentina, la garantía cubre cualquier defecto de fábrica por 12 meses directamente en nuestra sede o talleres autorizados.",
                    usuario_atencion_id=admin_user.id if admin_user else 1
                ),
                PQR(
                    id=2,
                    radicado="PQR-2026-00002",
                    usuario_id=client_user.id if client_user else 3,
                    cliente_nombre="Valentina Gómez",
                    cliente_email="cliente@nexusgames.com",
                    cliente_telefono="3209876543",
                    tipo="Sugerencia",
                    asunto="Disponibilidad de periféricos inalámbricos",
                    descripcion="Sugiero agregar teclados 75% mecánicos inalámbricos con switches magnéticos.",
                    estado="Pendiente"
                ),
                PQR(
                    id=3,
                    radicado="PQR-2026-00003",
                    usuario_id=None,
                    cliente_nombre="Andrés Felipe Mendoza",
                    cliente_email="andres.mendoza@gmail.com",
                    cliente_telefono="3124567890",
                    tipo="Queja",
                    asunto="Demora en confirmación de pago PSE",
                    descripcion="Realicé un pago por PSE y tardó 15 minutos en reflejarse la clave en el correo.",
                    estado="En Proceso",
                    respuesta="Hola Andrés, estamos verificando con la pasarela bancaria el registro de la transacción."
                )
            ]
            db.add_all(pqrs_data)
            db.commit()

        # 9. SEMILLAS DE VENTAS Y FACTURAS (QUINTO AVANCE)
        if db.query(Sale).count() == 0:
            sale1 = Sale(
                id=1,
                numero_venta="VENT-2026-00001",
                cliente_id=client_user.id if client_user else 3,
                usuario_operacion_id=emp_user.id if emp_user else 2,
                subtotal=469800.0,
                descuento=0.0,
                impuestos=89262.0,
                total=559062.0,
                metodo_pago="Tarjeta de Crédito / PSE",
                estado="Completada",
                notas="Compra online con entrega de licencias por correo"
            )
            db.add(sale1)
            db.flush()

            det1 = SaleDetail(
                venta_id=sale1.id,
                tipo_item="Producto",
                producto_id=1,
                nombre_item="Cyberpunk 2077: Phantom Liberty",
                cantidad=1,
                precio_unitario=219900.0,
                subtotal=219900.0
            )
            det2 = SaleDetail(
                venta_id=sale1.id,
                tipo_item="Producto",
                producto_id=2,
                nombre_item="Elden Ring: Shadow of the Erdtree",
                cantidad=1,
                precio_unitario=249900.0,
                subtotal=249900.0
            )
            db.add_all([det1, det2])

            inv1 = Invoice(
                id=1,
                numero_factura="FACT-2026-00001",
                venta_id=sale1.id,
                cliente_id=client_user.id if client_user else 3,
                subtotal=469800.0,
                impuestos=89262.0,
                descuento=0.0,
                total=559062.0,
                estado="Emitida",
                notas="Factura electrónica generada automáticamente"
            )
            db.add(inv1)
            db.flush()

            inv_det1 = InvoiceDetail(
                factura_id=inv1.id,
                tipo_item="Producto",
                item_id=1,
                descripcion="Cyberpunk 2077: Phantom Liberty",
                cantidad=1,
                precio_unitario=219900.0,
                subtotal=219900.0
            )
            inv_det2 = InvoiceDetail(
                factura_id=inv1.id,
                tipo_item="Producto",
                item_id=2,
                descripcion="Elden Ring: Shadow of the Erdtree",
                cantidad=1,
                precio_unitario=249900.0,
                subtotal=249900.0
            )
            db.add_all([inv_det1, inv_det2])

            # Venta 2 con servicio técnico
            sale2 = Sale(
                id=2,
                numero_venta="VENT-2026-00002",
                cliente_id=client_user.id if client_user else 3,
                usuario_operacion_id=emp_user.id if emp_user else 2,
                subtotal=500000.0,
                descuento=0.0,
                impuestos=95000.0,
                total=595000.0,
                metodo_pago="PSE / Transferencia",
                estado="Completada",
                notas="Venta combinada producto + servicio técnico gamer"
            )
            db.add(sale2)
            db.flush()

            det3 = SaleDetail(
                venta_id=sale2.id,
                tipo_item="Producto",
                producto_id=5,
                nombre_item="Teclado Mecánico Custom RGB Hot-Swap",
                cantidad=1,
                precio_unitario=380000.0,
                subtotal=380000.0
            )
            det4 = SaleDetail(
                venta_id=sale2.id,
                tipo_item="Servicio",
                servicio_id=1,
                nombre_item="Mantenimiento Preventivo y Limpieza Profunda PC/Consola",
                cantidad=1,
                precio_unitario=120000.0,
                subtotal=120000.0
            )
            db.add_all([det3, det4])

            inv2 = Invoice(
                id=2,
                numero_factura="FACT-2026-00002",
                venta_id=sale2.id,
                cliente_id=client_user.id if client_user else 3,
                subtotal=500000.0,
                impuestos=95000.0,
                descuento=0.0,
                total=595000.0,
                estado="Emitida",
                notas="Factura por periférico y servicio de mantenimiento técnico"
            )
            db.add(inv2)
            db.flush()

            inv_det3 = InvoiceDetail(
                factura_id=inv2.id,
                tipo_item="Producto",
                item_id=5,
                descripcion="Teclado Mecánico Custom RGB Hot-Swap",
                cantidad=1,
                precio_unitario=380000.0,
                subtotal=380000.0
            )
            inv_det4 = InvoiceDetail(
                factura_id=inv2.id,
                tipo_item="Servicio",
                item_id=1,
                descripcion="Mantenimiento Preventivo y Limpieza Profunda PC/Consola",
                cantidad=1,
                precio_unitario=120000.0,
                subtotal=120000.0
            )
            db.add_all([inv_det3, inv_det4])
            db.commit()

        # 10. SEMILLAS DE PROVEEDORES
        if db.query(Supplier).count() == 0:
            supps = [
                Supplier(
                    id=1,
                    nit_rut="900.123.456-1",
                    razon_social="TechGlobal Gaming Distribution S.A.S.",
                    contacto_nombre="Mauricio Herrera",
                    telefono="3104567890",
                    email="ventas@techglobal.co",
                    direccion="Zona Franca Fontibón Edificio 4",
                    ciudad="Bogotá",
                    estado="Activo"
                ),
                Supplier(
                    id=2,
                    nit_rut="901.987.654-2",
                    razon_social="Nexus Hardware Import & Co.",
                    contacto_nombre="Laura Restrepo",
                    telefono="3187654321",
                    email="comercial@nexushardware.com",
                    direccion="Parque Industrial del Norte Bodega 12",
                    ciudad="Medellín",
                    estado="Activo"
                ),
                Supplier(
                    id=3,
                    nit_rut="890.334.221-5",
                    razon_social="Distribuidora Gamer del Pacífico",
                    contacto_nombre="Fernando Castro",
                    telefono="3156781234",
                    email="contacto@gamerpacifico.com",
                    direccion="Avenida Roosevelt # 34-12",
                    ciudad="Cali",
                    estado="Activo"
                )
            ]
            db.add_all(supps)
            db.commit()

        # 11. SEMILLAS DE COMPRAS Y MOVIMIENTOS DE INVENTARIO
        if db.query(Purchase).count() == 0:
            p1 = Purchase(
                id=1,
                numero_compra="COMP-2026-00001",
                proveedor_id=1,
                usuario_id=admin_user.id if admin_user else 1,
                subtotal=4800000.0,
                impuestos=912000.0,
                total=5712000.0,
                metodo_pago="Transferencia Bancaria",
                estado="Completada",
                notas="Abastecimiento de stock de videojuegos y periféricos"
            )
            db.add(p1)
            db.flush()

            p_det1 = PurchaseDetail(compra_id=p1.id, producto_id=1, cantidad=15, precio_costo_unitario=140000.0, subtotal=2100000.0)
            p_det2 = PurchaseDetail(compra_id=p1.id, producto_id=5, cantidad=10, precio_costo_unitario=270000.0, subtotal=2700000.0)
            db.add_all([p_det1, p_det2])

            p2 = Purchase(
                id=2,
                numero_compra="COMP-2026-00002",
                proveedor_id=2,
                usuario_id=admin_user.id if admin_user else 1,
                subtotal=9900000.0,
                impuestos=1881000.0,
                total=11781000.0,
                metodo_pago="Transferencia Bancaria",
                estado="Completada",
                notas="Lote de componentes gráficos RTX y procesadores AMD"
            )
            db.add(p2)
            db.flush()

            p_det3 = PurchaseDetail(compra_id=p2.id, producto_id=4, cantidad=2, precio_costo_unitario=3600000.0, subtotal=7200000.0)
            p_det4 = PurchaseDetail(compra_id=p2.id, producto_id=8, cantidad=3, precio_costo_unitario=900000.0, subtotal=2700000.0)
            db.add_all([p_det3, p_det4])

            # Movimientos iniciales de trazabilidad
            movs = [
                InventoryMovement(producto_id=1, tipo_movimiento="ENTRADA_COMPRA", cantidad=15, stock_anterior=0, stock_nuevo=15, motivo="Recepción compra inicial", referencia="COMP-2026-00001", usuario_id=1),
                InventoryMovement(producto_id=5, tipo_movimiento="ENTRADA_COMPRA", cantidad=10, stock_anterior=15, stock_nuevo=25, motivo="Recepción compra inicial", referencia="COMP-2026-00001", usuario_id=1),
                InventoryMovement(producto_id=4, tipo_movimiento="ENTRADA_COMPRA", cantidad=2, stock_anterior=2, stock_nuevo=4, motivo="Recepción de tarjetas gráficas", referencia="COMP-2026-00002", usuario_id=1),
                InventoryMovement(producto_id=8, tipo_movimiento="ENTRADA_COMPRA", cantidad=3, stock_anterior=7, stock_nuevo=10, motivo="Recepción de procesadores", referencia="COMP-2026-00002", usuario_id=1),
            ]
            db.add_all(movs)
            db.commit()

    except Exception as e:
        db.rollback()
        print(f"Error en init_db: {e}")
    finally:
        db.close()
