import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { get, run, query } from '../config/db.js';

// Generador de Token JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      rol_id: user.rol_id,
      rol_nombre: user.rol_nombre
    },
    process.env.JWT_SECRET || 'nexus_games_super_secret_jwt_key_2026_sena',
    { expiresIn: '7d' }
  );
};

// 1. REGISTRO DE USUARIOS (CLIENTES O ADMINISTRATIVOS)
export const register = async (req, res) => {
  try {
    const { nombre, apellido, tipo_documento, numero_documento, direccion, telefono, email, password, rol_id } = req.body;

    // Validaciones obligatorias de campos
    if (!nombre || !apellido || !tipo_documento || !numero_documento || !direccion || !telefono || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios.'
      });
    }

    // Validación de nombres y apellidos (solo letras, longitud 2 a 40)
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

    // Validación de tipo de documento
    const validDocTypes = ['CC', 'CE', 'TI', 'PP', 'NIT'];
    if (!validDocTypes.includes(tipo_documento)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de documento no válido.'
      });
    }

    // Validación de longitud y formato de documento
    const docRegex = /^[0-9a-zA-Z-]{6,12}$/;
    if (!docRegex.test(numero_documento.trim())) {
      return res.status(400).json({
        success: false,
        message: 'El número de documento debe tener entre 6 y 12 caracteres alfanuméricos.'
      });
    }

    // Validación de dirección (5 a 100 caracteres)
    if (direccion.trim().length < 5 || direccion.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: 'La dirección debe tener entre 5 y 100 caracteres.'
      });
    }

    // Validación de número de teléfono (exactamente 10 dígitos numéricos)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(telefono.trim())) {
      return res.status(400).json({
        success: false,
        message: 'El número de teléfono debe tener exactamente 10 dígitos numéricos (Ej. 3001234567).'
      });
    }

    // Validación de formato de correo con expresión regular y longitud máxima
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.trim().length > 80 || !emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'El formato del correo electrónico no es válido o excede 80 caracteres.'
      });
    }

    // Validación de contraseña: mínimo 8 caracteres, máximo 64 caracteres, y al menos un carácter especial
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

    // Verificar si el correo ya existe
    const existingEmail = await get('SELECT id FROM usuarios WHERE email = ?', [email.toLowerCase().trim()]);
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico ya se encuentra registrado.'
      });
    }

    // Verificar si el documento ya existe
    const existingDoc = await get('SELECT id FROM usuarios WHERE numero_documento = ?', [numero_documento.trim()]);
    if (existingDoc) {
      return res.status(400).json({
        success: false,
        message: 'El número de documento ya está asociado a otra cuenta.'
      });
    }

    // Encriptar contraseña con Hashing Seguro (Bcrypt)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Asignar rol (por defecto 3 = Cliente, o el especificado si viene de un admin)
    const finalRoleId = rol_id ? parseInt(rol_id) : 3;

    // Insertar en la base de datos SQL
    const result = await run(
      `INSERT INTO usuarios (nombre, apellido, tipo_documento, numero_documento, direccion, telefono, email, password, rol_id, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Activo')`,
      [
        nombre.trim(),
        apellido.trim(),
        tipo_documento,
        numero_documento.trim(),
        direccion.trim(),
        telefono.trim(),
        email.toLowerCase().trim(),
        hashedPassword,
        finalRoleId
      ]
    );

    // Obtener el rol asignado
    const roleInfo = await get('SELECT nombre FROM roles WHERE id = ?', [finalRoleId]);

    const newUser = {
      id: result.id,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: email.toLowerCase().trim(),
      tipo_documento,
      numero_documento: numero_documento.trim(),
      direccion: direccion.trim(),
      telefono: telefono.trim(),
      rol_id: finalRoleId,
      rol_nombre: roleInfo ? roleInfo.nombre : 'Cliente',
      estado: 'Activo',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`
    };

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: '¡Usuario registrado exitosamente!',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno en el servidor al procesar el registro.'
    });
  }
};

// 2. INICIO DE SESIÓN CON GENERACIÓN DE JWT
export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Por favor ingresa tu correo y contraseña en formato JSON.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = String(password);

    // Buscar usuario por correo
    const user = await get(
      `SELECT u.id, u.nombre, u.apellido, u.tipo_documento, u.numero_documento, 
              u.direccion, u.telefono, u.email, u.password, u.rol_id, u.estado, r.nombre as rol_nombre
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.email = ?`,
      [cleanEmail]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas. Correo o contraseña incorrectos.'
      });
    }

    // Verificar si el usuario está activo
    if (user.estado !== 'Activo') {
      return res.status(403).json({
        success: false,
        message: 'Esta cuenta ha sido desactivada por un administrador.'
      });
    }

    // Comparar contraseña con el hash seguro almacenado
    const isMatch = await bcrypt.compare(cleanPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas. Correo o contraseña incorrectos.'
      });
    }

    // Obtener permisos del usuario
    const permisos = await query(
      `SELECT p.codigo, p.nombre, p.modulo
       FROM permisos p
       JOIN rol_permisos rp ON p.id = rp.permiso_id
       WHERE rp.rol_id = ?`,
      [user.rol_id]
    );

    const safeUser = {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      nombre_completo: `${user.nombre} ${user.apellido}`,
      email: user.email,
      tipo_documento: user.tipo_documento,
      numero_documento: user.numero_documento,
      direccion: user.direccion,
      telefono: user.telefono,
      rol_id: user.rol_id,
      rol_nombre: user.rol_nombre,
      estado: user.estado,
      permisos: permisos ? permisos.map((p) => p.codigo) : [],
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`
    };

    const token = generateToken(safeUser);

    return res.status(200).json({
      success: true,
      message: `¡Bienvenido de nuevo, ${safeUser.nombre}!`,
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno en el servidor al autenticar.',
      error: error.message
    });
  }
};

// 3. OBTENER PERFIL ACTUAL (ME)
export const getProfile = async (req, res) => {
  try {
    const user = req.user;
    user.avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`;
    user.nombre_completo = `${user.nombre} ${user.apellido}`;
    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener datos del usuario.'
    });
  }
};

// 4. RECUPERACIÓN DE CONTRASEÑA
export const recoverPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico es requerido.'
      });
    }

    const user = await get('SELECT id FROM usuarios WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No existe una cuenta registrada con este correo electrónico.'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Se ha enviado un correo con instrucciones de restablecimiento a ${email}.`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al procesar recuperación de contraseña.'
    });
  }
};
