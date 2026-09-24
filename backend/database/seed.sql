-- =========================================================================
-- DATOS INICIALES (SEEDS) - NEXUS GAMES
-- =========================================================================

-- ROLES
INSERT OR IGNORE INTO roles (id, nombre, descripcion) VALUES
(1, 'Administrador', 'Acceso total al sistema, gestión de usuarios, productos, stock, roles y servicios'),
(2, 'Empleado', 'Gestión de productos, control y ajuste de stock, y visualización de pedidos y servicios'),
(3, 'Cliente', 'Consulta de catálogo, compras en línea, panel de perfil e historial de pedidos');

-- PERMISOS
INSERT OR IGNORE INTO permisos (id, codigo, nombre, modulo, descripcion) VALUES
(1, 'USERS_CREATE', 'Crear Usuarios', 'Usuarios', 'Permite registrar nuevos usuarios con cualquier rol'),
(2, 'USERS_READ', 'Ver Usuarios', 'Usuarios', 'Permite consultar la lista de usuarios y detalles'),
(3, 'USERS_UPDATE', 'Editar Usuarios', 'Usuarios', 'Permite modificar información de usuarios'),
(4, 'USERS_STATUS', 'Cambiar Estado de Usuario', 'Usuarios', 'Permite activar o desactivar usuarios'),
(5, 'USERS_DELETE', 'Eliminar Usuarios', 'Usuarios', 'Permite eliminar cuentas de usuario'),
(6, 'PRODUCTS_CREATE', 'Crear Productos', 'Productos', 'Permite dar de alta nuevos productos'),
(7, 'PRODUCTS_READ', 'Ver Productos', 'Productos', 'Permite consultar el catálogo completo de productos'),
(8, 'PRODUCTS_UPDATE', 'Editar Productos', 'Productos', 'Permite actualizar datos de productos'),
(9, 'PRODUCTS_STOCK', 'Gestionar Stock', 'Productos', 'Permite aumentar o disminuir inventario'),
(10, 'PRODUCTS_DELETE', 'Eliminar Productos', 'Productos', 'Permite dar de baja productos'),
(11, 'SERVICES_MANAGE', 'Gestionar Servicios', 'Servicios', 'Permite crear y actualizar servicios técnicos'),
(12, 'ORDERS_VIEW', 'Ver Pedidos', 'Ventas', 'Permite consultar pedidos realizados');

-- ROL_PERMISOS:
-- Admin (1) -> Todos los permisos (1 al 12)
INSERT OR IGNORE INTO rol_permisos (rol_id, permiso_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10), (1, 11), (1, 12);

-- Empleado (2) -> Ver usuarios básicos, CRUD productos/stock, ver pedidos
INSERT OR IGNORE INTO rol_permisos (rol_id, permiso_id) VALUES
(2, 2), (2, 6), (2, 7), (2, 8), (2, 9), (2, 11), (2, 12);

-- Cliente (3) -> Ver productos
INSERT OR IGNORE INTO rol_permisos (rol_id, permiso_id) VALUES
(3, 7);

-- CATEGORÍAS
INSERT OR IGNORE INTO categorias (id, nombre, descripcion, icono) VALUES
(1, 'Videojuegos', 'Juegos digitales y físicos para PC y consolas', 'Gamepad2'),
(2, 'Electrodomésticos Gamers', 'Monitores, sillas ergonómicas, iluminación y audio', 'Monitor'),
(3, 'Componentes y Hardware', 'Tarjetas gráficas, procesadores, memorias y fuentes', 'Cpu'),
(4, 'Accesorios y Periféricos', 'Teclados mecánicos, ratones gamer y auriculares', 'Headphones');

-- PRODUCTOS DE EJEMPLO CON DIFERENTES NIVELES DE STOCK
INSERT OR IGNORE INTO productos (id, nombre, descripcion, precio, stock, categoria_id, plataforma, imagen, destacado, estado) VALUES
(1, 'Cyberpunk 2077: Phantom Liberty', 'Sumérgete en la apasionante historia de espionaje en Night City con gráficos de última generación con Ray Tracing y DLSS 3.5.', 219900, 15, 1, 'PC / PS5 / Xbox Series', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000&auto=format&fit=crop', 1, 'Activo'),
(2, 'Elden Ring: Shadow of the Erdtree', 'Explora las Tierras Intermedias y el Reino de las Sombras en esta obra maestra del rol y acción desarrollada por FromSoftware.', 249900, 22, 1, 'Multiplataforma', 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1000&auto=format&fit=crop', 1, 'Activo'),
(3, 'Monitor Gamer Curvo 27" 240Hz QHD', 'Monitor OLED de respuesta 0.03ms, HDR1000 y resolución 2560x1440 con sincronización G-Sync / FreeSync Premium.', 1850000, 8, 2, 'Periféricos', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=1000&auto=format&fit=crop', 1, 'Activo'),
(4, 'Tarjeta Gráfica RTX 4080 Super 16GB', 'Máxima potencia para juegos en 4K y renderizado profesional con arquitectura Ada Lovelace y DLSS 3.', 4950000, 4, 3, 'Hardware PC', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=1000&auto=format&fit=crop', 1, 'Activo'),
(5, 'Teclado Mecánico Custom RGB Hot-Swap', 'Switches lubricados de fábrica, estructura gasket mount, teclas PBT de doble inyección e iluminación RGB personalizable.', 380000, 25, 4, 'Accesorios', 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=1000&auto=format&fit=crop', 0, 'Activo'),
(6, 'God of War Ragnarök', 'Acompaña a Kratos y Atreus en un mítico viaje por los Nueve Reinos enfrentando al destino y los dioses nórdicos.', 239900, 18, 1, 'PS5 / PC', 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1000&auto=format&fit=crop', 1, 'Activo'),
(7, 'Silla Gamer Ergonómica Premium Black & Gold', 'Soporte lumbar magnético 4D, espuma viscoelástica de alta densidad y acabado en cuero sintético reforzado.', 920000, 6, 2, 'Mobiliario', 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?q=80&w=1000&auto=format&fit=crop', 0, 'Activo'),
(8, 'Procesador AMD Ryzen 7 7800X3D', 'El rey indiscutible en rendimiento para gaming con tecnología 3D V-Cache, 8 núcleos y 16 hilos.', 1980000, 10, 3, 'Hardware PC', 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=1000&auto=format&fit=crop', 0, 'Activo');

-- SERVICIOS
INSERT OR IGNORE INTO servicios (id, nombre, descripcion, precio, duracion_estimada, icono, estado) VALUES
(1, 'Mantenimiento Preventivo y Limpieza Profunda PC/Consola', 'Desarme completo, limpieza por ultrasonido, cambio de pasta térmica de alto rendimiento y thermal pads.', 120000, '24 - 48 Horas', 'Wrench', 'Activo'),
(2, 'Ensamblaje y Optimización de PC Gamer Custom', 'Montaje estético con gestión de cables oculta, configuración de BIOS, curvas de ventilación y pruebas de estrés.', 180000, '24 Horas', 'Cpu', 'Activo'),
(3, 'Diagnóstico y Reparación de Hardware', 'Revisión exhaustiva con osciloscopio y cámaras térmicas para detectar fallas en placas base y tarjetas gráficas.', 80000, '48 Horas', 'Activity', 'Activo');

-- PQR (QUINTO AVANCE)
INSERT OR IGNORE INTO pqr (id, radicado, usuario_id, cliente_nombre, cliente_email, cliente_telefono, tipo, asunto, descripcion, estado, respuesta) VALUES
(1, 'PQR-2026-00001', 3, 'Valentina Gómez', 'cliente@nexusgames.com', '3209876543', 'Petición', 'Consulta sobre garantía de tarjeta gráfica RTX 4080', 'Deseo conocer los términos y cobertura del fabricante para la garantía de 12 meses de componentes de hardware.', 'Respondida', 'Apreciada Valentina, la garantía cubre cualquier defecto de fábrica por 12 meses directamente en nuestra sede o talleres autorizados.'),
(2, 'PQR-2026-00002', 3, 'Valentina Gómez', 'cliente@nexusgames.com', '3209876543', 'Sugerencia', 'Disponibilidad de periféricos inalámbricos', 'Sugiero agregar teclados 75% mecánicos inalámbricos con switches magnéticos.', 'Pendiente', NULL),
(3, 'PQR-2026-00003', NULL, 'Andrés Felipe Mendoza', 'andres.mendoza@gmail.com', '3124567890', 'Queja', 'Demora en confirmación de pago PSE', 'Realicé un pago por PSE y tardó 15 minutos en reflejarse la clave en el correo.', 'En Proceso', 'Hola Andrés, estamos verificando con la pasarela bancaria el registro de la transacción.');

-- VENTAS (QUINTO AVANCE)
INSERT OR IGNORE INTO ventas (id, numero_venta, cliente_id, usuario_operacion_id, subtotal, descuento, impuestos, total, metodo_pago, estado, notas) VALUES
(1, 'VENT-2026-00001', 3, 2, 469800.0, 0.0, 89262.0, 559062.0, 'Tarjeta de Crédito / PSE', 'Completada', 'Compra online con entrega de licencias por correo'),
(2, 'VENT-2026-00002', 3, 2, 500000.0, 0.0, 95000.0, 595000.0, 'PSE / Transferencia', 'Completada', 'Venta combinada producto + servicio técnico gamer');

-- DETALLE DE VENTAS
INSERT OR IGNORE INTO detalle_ventas (id, venta_id, tipo_item, producto_id, servicio_id, nombre_item, cantidad, precio_unitario, descuento, subtotal) VALUES
(1, 1, 'Producto', 1, NULL, 'Cyberpunk 2077: Phantom Liberty', 1, 219900.0, 0.0, 219900.0),
(2, 1, 'Producto', 2, NULL, 'Elden Ring: Shadow of the Erdtree', 1, 249900.0, 0.0, 249900.0),
(3, 2, 'Producto', 5, NULL, 'Teclado Mecánico Custom RGB Hot-Swap', 1, 380000.0, 0.0, 380000.0),
(4, 2, 'Servicio', NULL, 1, 'Mantenimiento Preventivo y Limpieza Profunda PC/Consola', 1, 120000.0, 0.0, 120000.0);

-- FACTURAS (QUINTO AVANCE)
INSERT OR IGNORE INTO facturas (id, numero_factura, venta_id, cliente_id, subtotal, impuestos, descuento, total, estado, notas) VALUES
(1, 'FACT-2026-00001', 1, 3, 469800.0, 89262.0, 0.0, 559062.0, 'Emitida', 'Factura electrónica generada automáticamente'),
(2, 'FACT-2026-00002', 2, 3, 500000.0, 95000.0, 0.0, 595000.0, 'Emitida', 'Factura por periférico y servicio de mantenimiento técnico');

-- DETALLE DE FACTURAS
INSERT OR IGNORE INTO detalle_facturas (id, factura_id, tipo_item, item_id, descripcion, cantidad, precio_unitario, subtotal) VALUES
(1, 1, 'Producto', 1, 'Cyberpunk 2077: Phantom Liberty', 1, 219900.0, 219900.0),
(2, 1, 'Producto', 2, 'Elden Ring: Shadow of the Erdtree', 1, 249900.0, 249900.0),
(3, 2, 'Producto', 5, 'Teclado Mecánico Custom RGB Hot-Swap', 1, 380000.0, 380000.0),
(4, 2, 'Servicio', 1, 'Mantenimiento Preventivo y Limpieza Profunda PC/Consola', 1, 120000.0, 120000.0);

-- PROVEEDORES
INSERT OR IGNORE INTO proveedores (id, nit_rut, razon_social, contacto_nombre, telefono, email, direccion, ciudad, estado) VALUES
(1, '900.123.456-1', 'TechGlobal Gaming Distribution S.A.S.', 'Mauricio Herrera', '3104567890', 'ventas@techglobal.co', 'Zona Franca Fontibón Edificio 4', 'Bogotá', 'Activo'),
(2, '901.987.654-2', 'Nexus Hardware Import & Co.', 'Laura Restrepo', '3187654321', 'comercial@nexushardware.com', 'Parque Industrial del Norte Bodega 12', 'Medellín', 'Activo'),
(3, '890.334.221-5', 'Distribuidora Gamer del Pacífico', 'Fernando Castro', '3156781234', 'contacto@gamerpacifico.com', 'Avenida Roosevelt # 34-12', 'Cali', 'Activo');

-- COMPRAS INICIALES
INSERT OR IGNORE INTO compras (id, numero_compra, proveedor_id, usuario_id, subtotal, impuestos, total, metodo_pago, estado, notas) VALUES
(1, 'COMP-2026-00001', 1, 1, 4800000.0, 912000.0, 5712000.0, 'Transferencia Bancaria', 'Completada', 'Abastecimiento de stock de videojuegos y periféricos'),
(2, 'COMP-2026-00002', 2, 1, 9900000.0, 1881000.0, 11781000.0, 'Transferencia Bancaria', 'Completada', 'Lote de componentes gráficos RTX y procesadores AMD');

-- DETALLE DE COMPRAS
INSERT OR IGNORE INTO detalle_compras (id, compra_id, producto_id, cantidad, precio_costo_unitario, subtotal) VALUES
(1, 1, 1, 15, 140000.0, 2100000.0),
(2, 1, 5, 10, 270000.0, 2700000.0),
(3, 2, 4, 2, 3600000.0, 7200000.0),
(4, 2, 8, 3, 900000.0, 2700000.0);

-- MOVIMIENTOS DE INVENTARIO INICIALES
INSERT OR IGNORE INTO movimientos_inventario (id, producto_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo, referencia, usuario_id) VALUES
(1, 1, 'ENTRADA_COMPRA', 15, 0, 15, 'Recepción de pedido compra inicial', 'COMP-2026-00001', 1),
(2, 5, 'ENTRADA_COMPRA', 10, 15, 25, 'Recepción de pedido compra inicial', 'COMP-2026-00001', 1),
(3, 4, 'ENTRADA_COMPRA', 2, 2, 4, 'Recepción de tarjetas gráficas', 'COMP-2026-00002', 1),
(4, 8, 'ENTRADA_COMPRA', 3, 7, 10, 'Recepción de procesadores', 'COMP-2026-00002', 1);

