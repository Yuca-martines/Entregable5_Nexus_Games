-- =========================================================================
-- PROYECTO: NEXUS GAMES - BASE DE DATOS RELACIONAL SQL (PostgreSQL)
-- COMPETENCIA: REACT + NODE.JS + BASE DE DATOS RELACIONAL
-- FICHA: 3406204 - SENA
-- =========================================================================

-- 1. TABLA DE ROLES
CREATE TABLE IF NOT EXISTS roles (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(50)  NOT NULL UNIQUE,
    descripcion VARCHAR(255) NOT NULL,
    creado_en   TIMESTAMP    DEFAULT NOW()
);

-- 2. TABLA DE PERMISOS
CREATE TABLE IF NOT EXISTS permisos (
    id          SERIAL PRIMARY KEY,
    codigo      VARCHAR(100) NOT NULL UNIQUE,
    nombre      VARCHAR(100) NOT NULL,
    modulo      VARCHAR(50)  NOT NULL,
    descripcion VARCHAR(255)
);

-- 3. TABLA INTERMEDIA ROL_PERMISOS (RELACIÓN MUCHOS A MUCHOS)
CREATE TABLE IF NOT EXISTS rol_permisos (
    rol_id     INTEGER NOT NULL,
    permiso_id INTEGER NOT NULL,
    PRIMARY KEY (rol_id, permiso_id),
    FOREIGN KEY (rol_id)     REFERENCES roles(id)    ON DELETE CASCADE,
    FOREIGN KEY (permiso_id) REFERENCES permisos(id) ON DELETE CASCADE
);

-- 4. TABLA DE USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id               SERIAL PRIMARY KEY,
    nombre           VARCHAR(100) NOT NULL,
    apellido         VARCHAR(100) NOT NULL,
    tipo_documento   VARCHAR(10)  NOT NULL,
    numero_documento VARCHAR(30)  NOT NULL UNIQUE,
    direccion        VARCHAR(255) NOT NULL,
    telefono         VARCHAR(20)  NOT NULL,
    email            VARCHAR(150) NOT NULL UNIQUE,
    password         VARCHAR(255) NOT NULL,
    rol_id           INTEGER      NOT NULL DEFAULT 3,
    estado           VARCHAR(20)  DEFAULT 'Activo' CHECK(estado IN ('Activo', 'Inactivo')),
    creado_en        TIMESTAMP    DEFAULT NOW(),
    actualizado_en   TIMESTAMP    DEFAULT NOW(),
    FOREIGN KEY (rol_id) REFERENCES roles(id)
);

-- 5. TABLA DE CATEGORÍAS
CREATE TABLE IF NOT EXISTS categorias (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    icono       VARCHAR(50)
);

-- 6. TABLA DE PRODUCTOS (JUEGOS, HARDWARE, ACCESORIOS CON CONTROL DE STOCK)
CREATE TABLE IF NOT EXISTS productos (
    id           SERIAL PRIMARY KEY,
    nombre       VARCHAR(150) NOT NULL,
    descripcion  TEXT         NOT NULL,
    precio       NUMERIC(12,2) NOT NULL CHECK(precio >= 0),
    stock        INTEGER      NOT NULL DEFAULT 0 CHECK(stock >= 0),
    categoria_id INTEGER      NOT NULL,
    plataforma   VARCHAR(50)  DEFAULT 'Multiplataforma',
    imagen       VARCHAR(500) NOT NULL,
    destacado    BOOLEAN      DEFAULT FALSE,
    estado       VARCHAR(20)  DEFAULT 'Activo' CHECK(estado IN ('Activo', 'Inactivo')),
    creado_en    TIMESTAMP    DEFAULT NOW(),
    actualizado_en TIMESTAMP  DEFAULT NOW(),
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

-- 7. TABLA DE SERVICIOS (MANTENIMIENTO, ARMADO DE PC, ASESORÍA)
CREATE TABLE IF NOT EXISTS servicios (
    id                SERIAL PRIMARY KEY,
    nombre            VARCHAR(150)  NOT NULL,
    descripcion       TEXT          NOT NULL,
    precio            NUMERIC(12,2) NOT NULL,
    duracion_estimada VARCHAR(50),
    icono             VARCHAR(50),
    estado            VARCHAR(20)   DEFAULT 'Activo' CHECK(estado IN ('Activo', 'Inactivo')),
    creado_en         TIMESTAMP     DEFAULT NOW()
);

-- 8. TABLA DE PEDIDOS / VENTAS
CREATE TABLE IF NOT EXISTS pedidos (
    id               SERIAL PRIMARY KEY,
    usuario_id       INTEGER       NOT NULL,
    total            NUMERIC(12,2) NOT NULL,
    metodo_pago      VARCHAR(50)   DEFAULT 'Tarjeta / En Línea',
    estado           VARCHAR(30)   DEFAULT 'Pendiente' CHECK(estado IN ('Pendiente', 'En proceso', 'Completada', 'Cancelada')),
    direccion_envio  VARCHAR(255),
    notas            TEXT,
    motivo_cancelacion VARCHAR(255),
    fecha_proceso    TIMESTAMP,
    fecha_entrega    TIMESTAMP,
    creado_en        TIMESTAMP     DEFAULT NOW(),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- 9. TABLA DE DETALLES DE PEDIDO
CREATE TABLE IF NOT EXISTS pedido_detalles (
    id              SERIAL PRIMARY KEY,
    pedido_id       INTEGER       NOT NULL,
    producto_id     INTEGER       NOT NULL,
    cantidad        INTEGER       NOT NULL CHECK(cantidad > 0),
    precio_unitario NUMERIC(12,2) NOT NULL,
    subtotal        NUMERIC(12,2) NOT NULL,
    FOREIGN KEY (pedido_id)   REFERENCES pedidos(id)   ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- =========================================================================
-- QUINTO AVANCE: GESTIÓN COMERCIAL, FACTURACIÓN, PQR E INTELIGENCIA ARTIFICIAL
-- =========================================================================

-- 10. TABLA DE VENTAS COMERCIALES (PRODUCTOS Y SERVICIOS)
CREATE TABLE IF NOT EXISTS ventas (
    id                    SERIAL PRIMARY KEY,
    numero_venta          VARCHAR(50)   NOT NULL UNIQUE,
    cliente_id            INTEGER       NOT NULL,
    usuario_operacion_id  INTEGER,
    subtotal              NUMERIC(12,2) NOT NULL DEFAULT 0.0,
    descuento             NUMERIC(12,2) NOT NULL DEFAULT 0.0,
    impuestos             NUMERIC(12,2) NOT NULL DEFAULT 0.0,
    total                 NUMERIC(12,2) NOT NULL DEFAULT 0.0,
    metodo_pago           VARCHAR(50)   DEFAULT 'Tarjeta de Crédito / PSE',
    estado                VARCHAR(30)   DEFAULT 'Completada',
    notas                 TEXT,
    fecha_hora            TIMESTAMP     DEFAULT NOW(),
    FOREIGN KEY (cliente_id)           REFERENCES usuarios(id),
    FOREIGN KEY (usuario_operacion_id) REFERENCES usuarios(id)
);

-- 11. TABLA DE DETALLE DE VENTAS
CREATE TABLE IF NOT EXISTS detalle_ventas (
    id              SERIAL PRIMARY KEY,
    venta_id        INTEGER       NOT NULL,
    tipo_item       VARCHAR(20)   NOT NULL DEFAULT 'Producto',
    producto_id     INTEGER,
    servicio_id     INTEGER,
    nombre_item     VARCHAR(200)  NOT NULL,
    cantidad        INTEGER       NOT NULL DEFAULT 1,
    precio_unitario NUMERIC(12,2) NOT NULL,
    descuento       NUMERIC(12,2) NOT NULL DEFAULT 0.0,
    subtotal        NUMERIC(12,2) NOT NULL,
    FOREIGN KEY (venta_id)    REFERENCES ventas(id)    ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (servicio_id) REFERENCES servicios(id)
);

-- 12. TABLA DE FACTURAS DE VENTA
CREATE TABLE IF NOT EXISTS facturas (
    id              SERIAL PRIMARY KEY,
    numero_factura  VARCHAR(50)   NOT NULL UNIQUE,
    venta_id        INTEGER       NOT NULL UNIQUE,
    cliente_id      INTEGER       NOT NULL,
    subtotal        NUMERIC(12,2) NOT NULL DEFAULT 0.0,
    impuestos       NUMERIC(12,2) NOT NULL DEFAULT 0.0,
    descuento       NUMERIC(12,2) NOT NULL DEFAULT 0.0,
    total           NUMERIC(12,2) NOT NULL DEFAULT 0.0,
    estado          VARCHAR(30)   DEFAULT 'Emitida',
    notas           TEXT,
    fecha_emision   TIMESTAMP     DEFAULT NOW(),
    FOREIGN KEY (venta_id)   REFERENCES ventas(id)   ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id)
);

-- 13. TABLA DE DETALLE DE FACTURAS
CREATE TABLE IF NOT EXISTS detalle_facturas (
    id              SERIAL PRIMARY KEY,
    factura_id      INTEGER       NOT NULL,
    tipo_item       VARCHAR(20)   NOT NULL DEFAULT 'Producto',
    item_id         INTEGER,
    descripcion     VARCHAR(255)  NOT NULL,
    cantidad        INTEGER       NOT NULL DEFAULT 1,
    precio_unitario NUMERIC(12,2) NOT NULL,
    subtotal        NUMERIC(12,2) NOT NULL,
    FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE
);

-- 14. TABLA DE PQR (PETICIONES, QUEJAS, RECLAMOS Y SUGERENCIAS)
CREATE TABLE IF NOT EXISTS pqr (
    id                  SERIAL PRIMARY KEY,
    radicado            VARCHAR(50)  NOT NULL UNIQUE,
    usuario_id          INTEGER,
    cliente_nombre      VARCHAR(150) NOT NULL,
    cliente_email       VARCHAR(150) NOT NULL,
    cliente_telefono    VARCHAR(30),
    tipo                VARCHAR(30)  NOT NULL,
    asunto              VARCHAR(200) NOT NULL,
    descripcion         TEXT         NOT NULL,
    estado              VARCHAR(30)  DEFAULT 'Pendiente',
    respuesta           TEXT,
    usuario_atencion_id INTEGER,
    fecha_radicacion    TIMESTAMP    DEFAULT NOW(),
    fecha_respuesta     TIMESTAMP,
    FOREIGN KEY (usuario_id)          REFERENCES usuarios(id),
    FOREIGN KEY (usuario_atencion_id) REFERENCES usuarios(id)
);

-- 15. TABLA DE CONVERSACIONES DEL CHATBOT CON IA
CREATE TABLE IF NOT EXISTS conversaciones (
    id         SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    usuario_id INTEGER,
    creado_en  TIMESTAMP    DEFAULT NOW(),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- 16. TABLA DE MENSAJES DE CONVERSACIÓN
CREATE TABLE IF NOT EXISTS mensajes (
    id               SERIAL PRIMARY KEY,
    conversacion_id  INTEGER      NOT NULL,
    remitente        VARCHAR(20)  NOT NULL,
    contenido        TEXT         NOT NULL,
    fecha_hora       TIMESTAMP    DEFAULT NOW(),
    FOREIGN KEY (conversacion_id) REFERENCES conversaciones(id) ON DELETE CASCADE
);

-- =========================================================================
-- MÓDULO DE PROVEEDORES, COMPRAS Y MOVIMIENTOS DE INVENTARIO (KARDEX)
-- =========================================================================

-- 17. TABLA DE PROVEEDORES
CREATE TABLE IF NOT EXISTS proveedores (
    id              SERIAL PRIMARY KEY,
    nit_rut         VARCHAR(50)  NOT NULL UNIQUE,
    razon_social    VARCHAR(150) NOT NULL,
    contacto_nombre VARCHAR(100),
    telefono        VARCHAR(30)  NOT NULL,
    email           VARCHAR(150) NOT NULL,
    direccion       VARCHAR(255),
    ciudad          VARCHAR(100) DEFAULT 'Bogotá',
    estado          VARCHAR(20)  DEFAULT 'Activo' CHECK(estado IN ('Activo', 'Inactivo')),
    creado_en       TIMESTAMP    DEFAULT NOW()
);

-- 18. TABLA DE COMPRAS (ABASTECIMIENTO DE STOCK)
CREATE TABLE IF NOT EXISTS compras (
    id             SERIAL PRIMARY KEY,
    numero_compra  VARCHAR(50)   NOT NULL UNIQUE,
    proveedor_id   INTEGER       NOT NULL,
    usuario_id     INTEGER       NOT NULL,
    subtotal       NUMERIC(12,2) NOT NULL DEFAULT 0.0,
    impuestos      NUMERIC(12,2) NOT NULL DEFAULT 0.0,
    total          NUMERIC(12,2) NOT NULL DEFAULT 0.0,
    metodo_pago    VARCHAR(50)   DEFAULT 'Transferencia Bancaria',
    estado         VARCHAR(30)   DEFAULT 'Completada',
    notas          TEXT,
    fecha_hora     TIMESTAMP     DEFAULT NOW(),
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
    FOREIGN KEY (usuario_id)   REFERENCES usuarios(id)
);

-- 19. TABLA DE DETALLE DE COMPRAS
CREATE TABLE IF NOT EXISTS detalle_compras (
    id                    SERIAL PRIMARY KEY,
    compra_id             INTEGER       NOT NULL,
    producto_id           INTEGER       NOT NULL,
    cantidad              INTEGER       NOT NULL CHECK(cantidad > 0),
    precio_costo_unitario NUMERIC(12,2) NOT NULL CHECK(precio_costo_unitario >= 0),
    subtotal              NUMERIC(12,2) NOT NULL,
    FOREIGN KEY (compra_id)   REFERENCES compras(id)   ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- 20. TABLA DE MOVIMIENTOS DE INVENTARIO (KARDEX TRAZABILIDAD)
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id               SERIAL PRIMARY KEY,
    producto_id      INTEGER      NOT NULL,
    tipo_movimiento  VARCHAR(50)  NOT NULL, -- 'ENTRADA_COMPRA', 'SALIDA_VENTA', 'AJUSTE_MANUAL', 'ANULACION_PEDIDO'
    cantidad         INTEGER      NOT NULL,
    stock_anterior   INTEGER      NOT NULL,
    stock_nuevo      INTEGER      NOT NULL,
    motivo           TEXT,
    referencia       VARCHAR(100),
    usuario_id       INTEGER,
    creado_en        TIMESTAMP    DEFAULT NOW(),
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)
);
