import { query, get } from '../config/db.js';

// 1. OBTENER TODOS LOS ROLES CON SUS PERMISOS ASIGNADOS
export const getAllRoles = async (req, res) => {
  try {
    const roles = await query('SELECT * FROM roles ORDER BY id ASC');
    const permissions = await query('SELECT * FROM permisos ORDER BY modulo, id ASC');
    const rolePermissions = await query('SELECT * FROM rol_permisos');

    const formattedRoles = roles.map((role) => {
      const assignedPermIds = rolePermissions
        .filter((rp) => rp.rol_id === role.id)
        .map((rp) => rp.permiso_id);
      
      const rolePerms = permissions.filter((p) => assignedPermIds.includes(p.id));

      return {
        ...role,
        permisos: rolePerms
      };
    });

    return res.status(200).json({
      success: true,
      roles: formattedRoles,
      todos_los_permisos: permissions
    });
  } catch (error) {
    console.error('Error al obtener roles y permisos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar roles y permisos.'
    });
  }
};

// 2. OBTENER RESUMEN ESTADÍSTICO PARA DASHBOARDS
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await get('SELECT COUNT(*) as count FROM usuarios');
    const totalClients = await get('SELECT COUNT(*) as count FROM usuarios WHERE rol_id = 3');
    const totalEmployees = await get('SELECT COUNT(*) as count FROM usuarios WHERE rol_id = 2');
    const totalProducts = await get('SELECT COUNT(*) as count FROM productos');
    const lowStockProducts = await get('SELECT COUNT(*) as count FROM productos WHERE stock <= 5');
    const totalServices = await get('SELECT COUNT(*) as count FROM servicios');
    const totalOrders = await get('SELECT COUNT(*) as count, IFNULL(SUM(total), 0) as revenue FROM pedidos');

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers: totalUsers.count,
        totalClients: totalClients.count,
        totalEmployees: totalEmployees.count,
        totalProducts: totalProducts.count,
        lowStockProducts: lowStockProducts.count,
        totalServices: totalServices.count,
        totalOrders: totalOrders.count,
        totalRevenue: totalOrders.revenue
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al calcular estadísticas.'
    });
  }
};
