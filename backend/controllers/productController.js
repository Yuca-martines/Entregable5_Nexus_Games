import { query, get, run } from '../config/db.js';

// 1. OBTENER TODOS LOS PRODUCTOS
export const getAllProducts = async (req, res) => {
  try {
    const { search, categoria_id, destacado, estado, minPrice, maxPrice } = req.query;
    let sql = `
      SELECT p.id, p.nombre, p.descripcion, p.precio, p.stock, 
             p.categoria_id, p.plataforma, p.imagen, p.destacado, p.estado,
             p.creado_en, c.nombre as categoria_nombre
      FROM productos p
      JOIN categorias c ON p.categoria_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ` AND (p.nombre LIKE ? OR p.descripcion LIKE ? OR p.plataforma LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (categoria_id) {
      sql += ` AND p.categoria_id = ?`;
      params.push(categoria_id);
    }

    if (destacado !== undefined && destacado !== '') {
      sql += ` AND p.destacado = ?`;
      params.push(parseInt(destacado));
    }

    if (estado) {
      sql += ` AND p.estado = ?`;
      params.push(estado);
    }

    if (minPrice) {
      sql += ` AND p.precio >= ?`;
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      sql += ` AND p.precio <= ?`;
      params.push(parseFloat(maxPrice));
    }

    sql += ` ORDER BY p.id DESC`;

    const products = await query(sql, params);
    return res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar catálogo de productos.'
    });
  }
};

// 2. OBTENER PRODUCTO POR ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await get(
      `SELECT p.*, c.nombre as categoria_nombre
       FROM productos p
       JOIN categorias c ON p.categoria_id = c.id
       WHERE p.id = ?`,
      [id]
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado.'
      });
    }

    return res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al consultar producto.'
    });
  }
};

// 3. CREAR PRODUCTO
export const createProduct = async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, categoria_id, plataforma, imagen, destacado, estado } = req.body;

    if (!nombre || !descripcion || precio === undefined || stock === undefined || !categoria_id) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, descripción, precio, stock y categoría son obligatorios.'
      });
    }

    const defaultImg = imagen || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop';

    const result = await run(
      `INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id, plataforma, imagen, destacado, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre.trim(),
        descripcion.trim(),
        parseFloat(precio),
        parseInt(stock),
        parseInt(categoria_id),
        plataforma ? plataforma.trim() : 'Multiplataforma',
        defaultImg.trim(),
        destacado ? 1 : 0,
        estado || 'Activo'
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente.',
      productId: result.id
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al registrar el producto.'
    });
  }
};

// 4. ACTUALIZAR PRODUCTO
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock, categoria_id, plataforma, imagen, destacado, estado } = req.body;

    const current = await get('SELECT * FROM productos WHERE id = ?', [id]);
    if (!current) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado.'
      });
    }

    await run(
      `UPDATE productos 
       SET nombre = ?, descripcion = ?, precio = ?, stock = ?, categoria_id = ?, 
           plataforma = ?, imagen = ?, destacado = ?, estado = ?, actualizado_en = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        nombre ? nombre.trim() : current.nombre,
        descripcion ? descripcion.trim() : current.descripcion,
        precio !== undefined ? parseFloat(precio) : current.precio,
        stock !== undefined ? parseInt(stock) : current.stock,
        categoria_id !== undefined ? parseInt(categoria_id) : current.categoria_id,
        plataforma !== undefined ? plataforma : current.plataforma,
        imagen !== undefined ? imagen : current.imagen,
        destacado !== undefined ? (destacado ? 1 : 0) : current.destacado,
        estado || current.estado,
        id
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Producto actualizado satisfactoriamente.'
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar el producto.'
    });
  }
};

// 5. AJUSTAR / ACTUALIZAR STOCK ESPECÍFICAMENTE
export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, delta } = req.body;

    const product = await get('SELECT id, nombre, stock FROM productos WHERE id = ?', [id]);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado.'
      });
    }

    let newStock = product.stock;
    if (stock !== undefined) {
      newStock = Math.max(0, parseInt(stock));
    } else if (delta !== undefined) {
      newStock = Math.max(0, product.stock + parseInt(delta));
    }

    await run('UPDATE productos SET stock = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?', [newStock, id]);

    return res.status(200).json({
      success: true,
      message: `Stock de "${product.nombre}" actualizado a ${newStock} unidades.`,
      productId: id,
      newStock
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar el stock.'
    });
  }
};

// 6. ELIMINAR PRODUCTO
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await get('SELECT id FROM productos WHERE id = ?', [id]);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado.'
      });
    }

    await run('DELETE FROM productos WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Producto eliminado correctamente.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar producto.'
    });
  }
};

// 7. OBTENER CATEGORÍAS
export const getCategories = async (req, res) => {
  try {
    const categories = await query('SELECT * FROM categorias ORDER BY id ASC');
    return res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al obtener categorías.'
    });
  }
};
