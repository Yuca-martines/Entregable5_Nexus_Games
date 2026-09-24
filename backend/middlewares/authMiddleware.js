import jwt from 'jsonwebtoken';
import { get, query } from '../config/db.js';

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Acceso no autorizado. Token no proporcionado o formato inválido.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nexus_games_super_secret_jwt_key_2026_sena');

    // Buscar usuario y su rol en la base de datos
    const user = await get(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.tipo_documento, u.numero_documento, 
              u.direccion, u.telefono, u.rol_id, u.estado, r.nombre as rol_nombre
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.id = ?`,
      [decoded.id]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado o sesión caducada.'
      });
    }

    if (user.estado !== 'Activo') {
      return res.status(403).json({
        success: false,
        message: 'Tu cuenta se encuentra inactiva. Por favor contacta al administrador.'
      });
    }

    // Obtener permisos asignados al rol
    const permisos = await query(
      `SELECT p.codigo, p.nombre, p.modulo
       FROM permisos p
       JOIN rol_permisos rp ON p.id = rp.permiso_id
       WHERE rp.rol_id = ?`,
      [user.rol_id]
    );

    user.permisos = permisos.map((p) => p.codigo);
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'El token ha expirado. Por favor inicia sesión nuevamente.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token de autenticación inválido.'
    });
  }
};
