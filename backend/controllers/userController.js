import bcrypt from 'bcryptjs';
import { query, get, run } from '../config/db.js';

// 1. OBTENER TODOS LOS USUARIOS (CON BÚSQUEDA Y FILTROS)
export const getAllUsers = async (req, res) => {
  try {
    const { search, rol_id, estado } = req.query;
    let sql = `
      SELECT u.id, u.nombre, u.apellido, u.tipo_documento, u.numero_documento,
             u.direccion, u.telefono, u.email, u.rol_id, u.estado, u.creado_en,
             r.nombre as rol_nombre
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ` AND (u.nombre LIKE ? OR u.apellido LIKE ? OR u.email LIKE ? OR u.numero_documento LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (rol_id) {
      sql += ` AND u.rol_id = ?`;
      params.push(rol_id);
    }

    if (estado) {
      sql += ` AND u.estado = ?`;
      params.push(estado);
    }

    sql += ` ORDER BY u.id DESC`;

    const users = await query(sql, params);
    const formatted = users.map((u) => ({
      ...u,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${u.email}`
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      users: formatted
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar la lista de usuarios.'
    });
  }
};

// 2. OBTENER USUARIO POR ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await get(
      `SELECT u.id, u.nombre, u.apellido, u.tipo_documento, u.numero_documento,
              u.direccion, u.telefono, u.email, u.rol_id, u.estado, u.creado_en,
              r.nombre as rol_nombre
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.id = ?`,
      [id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        ...user,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al consultar usuario.'
    });
  }
};

// 3. CREAR NUEVO USUARIO DESDE PANEL DE ADMINISTRADOR
export const createUser = async (req, res) => {
  try {
    const { nombre, apellido, tipo_documento, numero_documento, direccion, telefono, email, password, rol_id, estado } = req.body;

    if (!nombre || !apellido || !tipo_documento || !numero_documento || !direccion || !telefono || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos obligatorios deben ser diligenciados.'
      });
    }

    // Validación de nombres y apellidos
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,40}$/;
    if (!nameRegex.test(nombre.trim())) {
      return res.status(400).json({
        success: false,
        message: 'El nombre debe contener entre 2 y 40 caracteres y solo letras.'
      });
    }

    if (!nameRegex.test(apellido.trim())) {
      return res.status(400).json({
        success: false,
        message: 'El apellido debe contener entre 2 y 40 caracteres y solo letras.'
      });
    }

    // Validación de documento
    const docRegex = /^[0-9a-zA-Z-]{6,12}$/;
    if (!docRegex.test(numero_documento.trim())) {
      return res.status(400).json({
        success: false,
        message: 'El número de documento debe tener entre 6 y 12 caracteres alfanuméricos.'
      });
    }

    // Validación de dirección
    if (direccion.trim().length < 5 || direccion.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: 'La dirección debe tener entre 5 y 100 caracteres.'
      });
    }

    // Validación de teléfono (10 dígitos numéricos)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(telefono.trim())) {
      return res.status(400).json({
        success: false,
        message: 'El número de teléfono debe tener exactamente 10 dígitos numéricos (Ej. 3001234567).'
      });
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.trim().length > 80 || !emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'El formato del correo electrónico no es válido o excede 80 caracteres.'
      });
    }

    // Validación de contraseña
    const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;
    if (password.length < 8 || password.length > 64) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener entre 8 y 64 caracteres.'
      });
    }

    if (!specialCharRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe incluir al menos un carácter especial (!, @, #, $, %, *, etc.).'
      });
    }

    const existingEmail = await get('SELECT id FROM usuarios WHERE email = ?', [email.toLowerCase().trim()]);
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico ya se encuentra registrado.'
      });
    }

    const existingDoc = await get('SELECT id FROM usuarios WHERE numero_documento = ?', [numero_documento.trim()]);
    if (existingDoc) {
      return res.status(400).json({
        success: false,
        message: 'El número de documento ya está asignado a otro usuario.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const finalRoleId = rol_id ? parseInt(rol_id) : 3;
    const finalStatus = estado || 'Activo';

    const result = await run(
      `INSERT INTO usuarios (nombre, apellido, tipo_documento, numero_documento, direccion, telefono, email, password, rol_id, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre.trim(), apellido.trim(), tipo_documento, numero_documento.trim(), direccion.trim(), telefono.trim(), email.toLowerCase().trim(), hashedPassword, finalRoleId, finalStatus]
    );

    return res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente.',
      userId: result.id
    });
  } catch (error) {
    console.error('Error creando usuario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear el usuario en la base de datos.'
    });
  }
};

// 4. ACTUALIZAR DATOS DE USUARIO
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, tipo_documento, numero_documento, direccion, telefono, email, rol_id, estado, password } = req.body;

    const user = await get('SELECT * FROM usuarios WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    // Validaciones de formato y longitud si se modifican
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,40}$/;
    if (nombre && !nameRegex.test(nombre.trim())) {
      return res.status(400).json({
        success: false,
        message: 'El nombre debe contener entre 2 y 40 caracteres y solo letras.'
      });
    }

    if (apellido && !nameRegex.test(apellido.trim())) {
      return res.status(400).json({
        success: false,
        message: 'El apellido debe contener entre 2 y 40 caracteres y solo letras.'
      });
    }

    if (telefono) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(telefono.trim())) {
        return res.status(400).json({
          success: false,
          message: 'El número de teléfono debe tener exactamente 10 dígitos numéricos (Ej. 3001234567).'
        });
      }
    }

    if (numero_documento) {
      const docRegex = /^[0-9a-zA-Z-]{6,12}$/;
      if (!docRegex.test(numero_documento.trim())) {
        return res.status(400).json({
          success: false,
          message: 'El número de documento debe tener entre 6 y 12 caracteres alfanuméricos.'
        });
      }
    }

    // Si cambia el correo, verificar duplicados
    if (email && email.toLowerCase().trim() !== user.email) {
      const emailConflict = await get('SELECT id FROM usuarios WHERE email = ? AND id != ?', [email.toLowerCase().trim(), id]);
      if (emailConflict) {
        return res.status(400).json({
          success: false,
          message: 'El correo electrónico ya pertenece a otro usuario.'
        });
      }
    }

    // Si cambia el documento, verificar duplicados
    if (numero_documento && numero_documento.trim() !== user.numero_documento) {
      const docConflict = await get('SELECT id FROM usuarios WHERE numero_documento = ? AND id != ?', [numero_documento.trim(), id]);
      if (docConflict) {
        return res.status(400).json({
          success: false,
          message: 'El documento ya está registrado para otro usuario.'
        });
      }
    }

    let updatedPassword = user.password;
    if (password && password.trim().length > 0) {
      const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;
      if (password.length < 8 || password.length > 64) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe tener entre 8 y 64 caracteres.'
        });
      }
      if (!specialCharRegex.test(password)) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe incluir al menos un carácter especial (!, @, #, $, %, *, etc.).'
        });
      }
      updatedPassword = await bcrypt.hash(password.trim(), 10);
    }

    await run(
      `UPDATE usuarios 
       SET nombre = ?, apellido = ?, tipo_documento = ?, numero_documento = ?, 
           direccion = ?, telefono = ?, email = ?, password = ?, rol_id = ?, 
           estado = ?, actualizado_en = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        nombre ? nombre.trim() : user.nombre,
        apellido ? apellido.trim() : user.apellido,
        tipo_documento || user.tipo_documento,
        numero_documento ? numero_documento.trim() : user.numero_documento,
        direccion ? direccion.trim() : user.direccion,
        telefono ? telefono.trim() : user.telefono,
        email ? email.toLowerCase().trim() : user.email,
        updatedPassword,
        rol_id !== undefined ? parseInt(rol_id) : user.rol_id,
        estado || user.estado,
        id
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Usuario actualizado exitosamente.'
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al actualizar usuario.'
    });
  }
};

// 5. CAMBIAR ESTADO DE USUARIO (ACTIVO / INACTIVO)
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const user = await get('SELECT id, email, estado, rol_id FROM usuarios WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    // No permitir desactivar el admin principal
    if (user.email === 'admin@nexusgames.com') {
      return res.status(400).json({
        success: false,
        message: 'No se puede cambiar el estado del Administrador principal del sistema.'
      });
    }

    const newStatus = estado || (user.estado === 'Activo' ? 'Inactivo' : 'Activo');

    await run('UPDATE usuarios SET estado = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?', [newStatus, id]);

    return res.status(200).json({
      success: true,
      message: `El estado del usuario ahora es: ${newStatus}`,
      estado: newStatus
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del usuario.'
    });
  }
};

// 6. ELIMINAR USUARIO
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await get('SELECT id, email FROM usuarios WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    if (user.email === 'admin@nexusgames.com') {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el Administrador principal del sistema.'
      });
    }

    await run('DELETE FROM usuarios WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Usuario eliminado satisfactoriamente.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario.'
    });
  }
};
