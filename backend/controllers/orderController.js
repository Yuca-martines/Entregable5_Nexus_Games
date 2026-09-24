import { query, get, run } from '../config/db.js';

// 1. CREAR PEDIDO (CHECKOUT)
export const createOrder = async (req, res) => {
  try {
    const usuario_id = req.user.id;
    const { items, total, metodo_pago, direccion_envio } = req.body;

    if (!items || items.length === 0 || !total) {
      return res.status(400).json({
        success: false,
        message: 'El pedido debe contener al menos un producto.'
      });
    }

    // Crear el registro de pedido
    const orderResult = await run(
      `INSERT INTO pedidos (usuario_id, total, metodo_pago, estado, direccion_envio)
       VALUES (?, ?, ?, 'Completado', ?)`,
      [
        usuario_id,
        parseFloat(total),
        metodo_pago || 'Tarjeta de Crédito / PSE',
        direccion_envio || req.user.direccion || 'Dirección registrada'
      ]
    );

    const pedidoId = orderResult.id;

    // Insertar detalles y descontar stock
    for (const item of items) {
      const prodId = item.id;
      const cant = item.quantity || 1;
      const precio = item.precio || item.price;
      const subtotal = precio * cant;

      await run(
        `INSERT INTO pedido_detalles (pedido_id, producto_id, cantidad, precio_unitario, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [pedidoId, prodId, cant, precio, subtotal]
      );

      // Descontar del inventario
      await run(
        `UPDATE productos SET stock = MAX(0, stock - ?) WHERE id = ?`,
        [cant, prodId]
      );
    }

    return res.status(201).json({
      success: true,
      message: '¡Pedido procesado con éxito!',
      orderId: pedidoId
    });
  } catch (error) {
    console.error('Error al crear pedido:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al procesar la compra.'
    });
  }
};

// 2. OBTENER PEDIDOS DEL USUARIO AUTENTICADO
export const getMyOrders = async (req, res) => {
  try {
    const usuario_id = req.user.id;

    const orders = await query(
      `SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY id DESC`,
      [usuario_id]
    );

    const ordersWithDetails = await Promise.all(
      orders.map(async (o) => {
        const details = await query(
          `SELECT pd.*, p.nombre as producto_nombre, p.imagen as producto_imagen
           FROM pedido_detalles pd
           JOIN productos p ON pd.producto_id = p.id
           WHERE pd.pedido_id = ?`,
          [o.id]
        );
        return {
          ...o,
          items: details
        };
      })
    );

    return res.status(200).json({
      success: true,
      orders: ordersWithDetails
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al obtener pedidos.'
    });
  }
};

// 3. OBTENER TODOS LOS PEDIDOS (ADMIN / EMPLEADO)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await query(
      `SELECT p.*, u.nombre as cliente_nombre, u.apellido as cliente_apellido, u.email as cliente_email
       FROM pedidos p
       JOIN usuarios u ON p.usuario_id = u.id
       ORDER BY p.id DESC`
    );

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al consultar todos los pedidos.'
    });
  }
};
