import { query, get, run } from '../config/db.js';

// 1. OBTENER TODOS LOS SERVICIOS
export const getAllServices = async (req, res) => {
  try {
    const { estado } = req.query;
    let sql = 'SELECT * FROM servicios WHERE 1=1';
    const params = [];

    if (estado) {
      sql += ' AND estado = ?';
      params.push(estado);
    }

    sql += ' ORDER BY id ASC';

    const services = await query(sql, params);
    return res.status(200).json({
      success: true,
      count: services.length,
      services
    });
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar servicios.'
    });
  }
};

// 2. OBTENER SERVICIO POR ID
export const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await get('SELECT * FROM servicios WHERE id = ?', [id]);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado.'
      });
    }
    return res.status(200).json({
      success: true,
      service
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al consultar servicio.'
    });
  }
};

// 3. CREAR SERVICIO
export const createService = async (req, res) => {
  try {
    const { nombre, descripcion, precio, duracion_estimada, icono, estado } = req.body;
    if (!nombre || !descripcion || precio === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, descripción y precio son obligatorios.'
      });
    }

    const result = await run(
      `INSERT INTO servicios (nombre, descripcion, precio, duracion_estimada, icono, estado)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nombre.trim(),
        descripcion.trim(),
        parseFloat(precio),
        duracion_estimada ? duracion_estimada.trim() : '24 Horas',
        icono || 'Wrench',
        estado || 'Activo'
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Servicio registrado exitosamente.',
      serviceId: result.id
    });
  } catch (error) {
    console.error('Error creando servicio:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear el servicio.'
    });
  }
};

// 4. ACTUALIZAR SERVICIO
export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, duracion_estimada, icono, estado } = req.body;

    const current = await get('SELECT * FROM servicios WHERE id = ?', [id]);
    if (!current) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado.'
      });
    }

    await run(
      `UPDATE servicios 
       SET nombre = ?, descripcion = ?, precio = ?, duracion_estimada = ?, icono = ?, estado = ?
       WHERE id = ?`,
      [
        nombre ? nombre.trim() : current.nombre,
        descripcion ? descripcion.trim() : current.descripcion,
        precio !== undefined ? parseFloat(precio) : current.precio,
        duracion_estimada !== undefined ? duracion_estimada : current.duracion_estimada,
        icono !== undefined ? icono : current.icono,
        estado || current.estado,
        id
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Servicio actualizado correctamente.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar servicio.'
    });
  }
};

// 5. ELIMINAR SERVICIO
export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const current = await get('SELECT id FROM servicios WHERE id = ?', [id]);
    if (!current) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado.'
      });
    }

    await run('DELETE FROM servicios WHERE id = ?', [id]);
    return res.status(200).json({
      success: true,
      message: 'Servicio eliminado correctamente.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar servicio.'
    });
  }
};
