import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../database/database.sqlite');
const schemaPath = path.resolve(__dirname, '../database/schema.sql');
const seedPath = path.resolve(__dirname, '../database/seed.sql');

// Asegurar existencia de directorio
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new DatabaseSync(dbPath);
console.log('✅ Base de datos relacional SQL (SQLite nativo Node.js) inicializada.');

// Métodos auxiliares para consultas
export const query = async (sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  } catch (error) {
    console.error('SQL query error:', error.message, 'SQL:', sql);
    throw error;
  }
};

export const get = async (sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  } catch (error) {
    console.error('SQL get error:', error.message, 'SQL:', sql);
    throw error;
  }
};

export const run = async (sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    return {
      id: Number(result.lastInsertRowid),
      changes: result.changes
    };
  } catch (error) {
    console.error('SQL run error:', error.message, 'SQL:', sql);
    throw error;
  }
};

// Inicialización de tablas y datos semilla
export const initDB = async () => {
  try {
    // 1. Ejecutar Schema
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      db.exec(schemaSql);
      console.log('✅ Tablas relacionales SQL creadas/verificadas.');
    }

    // 2. Ejecutar Seeds
    if (fs.existsSync(seedPath)) {
      const seedSql = fs.readFileSync(seedPath, 'utf-8');
      db.exec(seedSql);
      console.log('✅ Semillas iniciales insertadas.');
    }

    // 3. Crear Usuarios de prueba con Bcrypt Hashing
    const adminExists = await get('SELECT id FROM usuarios WHERE email = ?', ['admin@nexusgames.com']);
    if (!adminExists) {
      const adminPass = await bcrypt.hash('Admin123*', 10);
      await run(
        `INSERT INTO usuarios (nombre, apellido, tipo_documento, numero_documento, direccion, telefono, email, password, rol_id, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Administrador', 'Nexus', 'CC', '1000000001', 'Calle 100 # 15-20, Bogotá', '3101234567', 'admin@nexusgames.com', adminPass, 1, 'Activo']
      );
      console.log('👤 Usuario Administrador creado: admin@nexusgames.com / Admin123*');
    }

    const employeeExists = await get('SELECT id FROM usuarios WHERE email = ?', ['empleado@nexusgames.com']);
    if (!employeeExists) {
      const empPass = await bcrypt.hash('Empleado123*', 10);
      await run(
        `INSERT INTO usuarios (nombre, apellido, tipo_documento, numero_documento, direccion, telefono, email, password, rol_id, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Carlos', 'Rodríguez', 'CC', '1000000002', 'Carrera 45 # 26-10, Medellín', '3157891234', 'empleado@nexusgames.com', empPass, 2, 'Activo']
      );
      console.log('👤 Usuario Empleado creado: empleado@nexusgames.com / Empleado123*');
    }

    const clientExists = await get('SELECT id FROM usuarios WHERE email = ?', ['cliente@nexusgames.com']);
    if (!clientExists) {
      const clientPass = await bcrypt.hash('Cliente123*', 10);
      await run(
        `INSERT INTO usuarios (nombre, apellido, tipo_documento, numero_documento, direccion, telefono, email, password, rol_id, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Valentina', 'Gómez', 'CC', '1000000003', 'Avenida 6N # 28-40, Cali', '3209876543', 'cliente@nexusgames.com', clientPass, 3, 'Activo']
      );
      console.log('👤 Usuario Cliente creado: cliente@nexusgames.com / Cliente123*');
    }
  } catch (error) {
    console.error('❌ Error en inicialización de BD:', error);
  }
};
