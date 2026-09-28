import pg from 'pg';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Cargar variables de entorno ANTES de crear el pool
// (necesario porque en ESM los imports se ejecutan antes que dotenv.config() en server.js)
dotenv.config();

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.resolve(__dirname, '../database/schema.sql');
const seedPath = path.resolve(__dirname, '../database/seed.sql');

// =========================================================================
// CONFIGURACIÓN DEL POOL DE CONEXIONES POSTGRESQL
// =========================================================================
const poolConfig = process.env.DATABASE_URL
  ? {
      // Usa la URL completa (Railway, Supabase, Neon, etc.)
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    }
  : {
      // Usa variables individuales (desarrollo local)
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT || '5432'),
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME     || 'nexus_games',
      ssl: false,
    };

const pool = new Pool({
  ...poolConfig,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en cliente PostgreSQL del pool:', err);
});

console.log('✅ Pool de conexiones PostgreSQL inicializado.');

// =========================================================================
// MÉTODOS AUXILIARES PARA CONSULTAS (interfaz compatible con el anterior)
// =========================================================================

/**
 * Ejecuta una consulta SELECT que devuelve múltiples filas.
 * @param {string} sql - Consulta SQL con placeholders $1, $2...
 * @param {Array}  params - Parámetros para la consulta
 * @returns {Promise<Array>}
 */
export const query = async (sql, params = []) => {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('SQL query error:', error.message, '\nSQL:', sql);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Ejecuta una consulta SELECT que devuelve una sola fila.
 * @param {string} sql - Consulta SQL con placeholders $1, $2...
 * @param {Array}  params - Parámetros para la consulta
 * @returns {Promise<Object|undefined>}
 */
export const get = async (sql, params = []) => {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows[0];
  } catch (error) {
    console.error('SQL get error:', error.message, '\nSQL:', sql);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Ejecuta una consulta INSERT / UPDATE / DELETE.
 * @param {string} sql - Consulta SQL con placeholders $1, $2...
 * @param {Array}  params - Parámetros para la consulta
 * @returns {Promise<{ id: number, changes: number }>}
 */
export const run = async (sql, params = []) => {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    // Si la consulta termina en RETURNING id, devolvemos el id
    const id = result.rows[0]?.id ?? null;
    return {
      id: id ? Number(id) : null,
      changes: result.rowCount
    };
  } catch (error) {
    console.error('SQL run error:', error.message, '\nSQL:', sql);
    throw error;
  } finally {
    client.release();
  }
};

// =========================================================================
// INICIALIZACIÓN DE TABLAS Y DATOS SEMILLA
// =========================================================================
export const initDB = async () => {
  const client = await pool.connect();
  try {
    // 1. Ejecutar Schema (crea todas las tablas)
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      await client.query(schemaSql);
      console.log('✅ Tablas PostgreSQL creadas/verificadas.');
    }

    // 2. Insertar Roles y Permisos base PRIMERO (usuarios los necesitan)
    await client.query(`
      INSERT INTO roles (id, nombre, descripcion) VALUES
      (1, 'Administrador', 'Acceso total al sistema, gestión de usuarios, productos, stock, roles y servicios'),
      (2, 'Empleado', 'Gestión de productos, control y ajuste de stock, y visualización de pedidos y servicios'),
      (3, 'Cliente', 'Consulta de catálogo, compras en línea, panel de perfil e historial de pedidos')
      ON CONFLICT (id) DO NOTHING;
      SELECT setval('roles_id_seq', COALESCE((SELECT MAX(id) FROM roles), 1));

      INSERT INTO permisos (id, codigo, nombre, modulo, descripcion) VALUES
      (1,  'USERS_CREATE',    'Crear Usuarios',            'Usuarios',  'Permite registrar nuevos usuarios con cualquier rol'),
      (2,  'USERS_READ',      'Ver Usuarios',              'Usuarios',  'Permite consultar la lista de usuarios y detalles'),
      (3,  'USERS_UPDATE',    'Editar Usuarios',           'Usuarios',  'Permite modificar información de usuarios'),
      (4,  'USERS_STATUS',    'Cambiar Estado de Usuario', 'Usuarios',  'Permite activar o desactivar usuarios'),
      (5,  'USERS_DELETE',    'Eliminar Usuarios',         'Usuarios',  'Permite eliminar cuentas de usuario'),
      (6,  'PRODUCTS_CREATE', 'Crear Productos',           'Productos', 'Permite dar de alta nuevos productos'),
      (7,  'PRODUCTS_READ',   'Ver Productos',             'Productos', 'Permite consultar el catálogo completo de productos'),
      (8,  'PRODUCTS_UPDATE', 'Editar Productos',          'Productos', 'Permite actualizar datos de productos'),
      (9,  'PRODUCTS_STOCK',  'Gestionar Stock',           'Productos', 'Permite aumentar o disminuir inventario'),
      (10, 'PRODUCTS_DELETE', 'Eliminar Productos',        'Productos', 'Permite dar de baja productos'),
      (11, 'SERVICES_MANAGE', 'Gestionar Servicios',       'Servicios', 'Permite crear y actualizar servicios técnicos'),
      (12, 'ORDERS_VIEW',     'Ver Pedidos',               'Ventas',    'Permite consultar pedidos realizados')
      ON CONFLICT (id) DO NOTHING;
      SELECT setval('permisos_id_seq', COALESCE((SELECT MAX(id) FROM permisos), 1));

      INSERT INTO rol_permisos (rol_id, permiso_id) VALUES
      (1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),(1,8),(1,9),(1,10),(1,11),(1,12),
      (2,2),(2,6),(2,7),(2,8),(2,9),(2,11),(2,12),
      (3,7)
      ON CONFLICT DO NOTHING;
    `);

    // 3. Crear Usuarios de prueba (dependen de roles)
    const adminExists = await get('SELECT id FROM usuarios WHERE email = $1', ['admin@nexusgames.com']);
    if (!adminExists) {
      const adminPass = await bcrypt.hash('Admin123*', 10);
      await run(
        `INSERT INTO usuarios (nombre, apellido, tipo_documento, numero_documento, direccion, telefono, email, password, rol_id, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (email) DO NOTHING`,
        ['Administrador', 'Nexus', 'CC', '1000000001', 'Calle 100 # 15-20, Bogotá', '3101234567', 'admin@nexusgames.com', adminPass, 1, 'Activo']
      );
      console.log('👤 Usuario Administrador creado: admin@nexusgames.com / Admin123*');
    }

    const employeeExists = await get('SELECT id FROM usuarios WHERE email = $1', ['empleado@nexusgames.com']);
    if (!employeeExists) {
      const empPass = await bcrypt.hash('Empleado123*', 10);
      await run(
        `INSERT INTO usuarios (nombre, apellido, tipo_documento, numero_documento, direccion, telefono, email, password, rol_id, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (email) DO NOTHING`,
        ['Carlos', 'Rodríguez', 'CC', '1000000002', 'Carrera 45 # 26-10, Medellín', '3157891234', 'empleado@nexusgames.com', empPass, 2, 'Activo']
      );
      console.log('👤 Usuario Empleado creado: empleado@nexusgames.com / Empleado123*');
    }

    const clientExists = await get('SELECT id FROM usuarios WHERE email = $1', ['cliente@nexusgames.com']);
    if (!clientExists) {
      const clientPass = await bcrypt.hash('Cliente123*', 10);
      await run(
        `INSERT INTO usuarios (nombre, apellido, tipo_documento, numero_documento, direccion, telefono, email, password, rol_id, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (email) DO NOTHING`,
        ['Valentina', 'Gómez', 'CC', '1000000003', 'Avenida 6N # 28-40, Cali', '3209876543', 'cliente@nexusgames.com', clientPass, 3, 'Activo']
      );
      console.log('👤 Usuario Cliente creado: cliente@nexusgames.com / Cliente123*');
    }

    // 3. Ejecutar Seeds DESPUÉS de que los usuarios existan
    //    (compras, movimientos_inventario, pqr, ventas, etc. referencian usuarios)
    if (fs.existsSync(seedPath)) {
      const seedSql = fs.readFileSync(seedPath, 'utf-8');
      await client.query(seedSql);
      console.log('✅ Semillas iniciales insertadas.');
    }

  } catch (error) {
    console.error('❌ Error en inicialización de BD:', error);
    throw error;
  } finally {
    client.release();
  }
};



export default pool;
