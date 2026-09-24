export const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado.'
      });
    }

    const userRole = req.user.rol_nombre.toLowerCase();
    const formattedRoles = allowedRoles.map((r) => r.toLowerCase());

    if (!formattedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}.`
      });
    }

    next();
  };
};

export const requirePermission = (permissionCode) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado.'
      });
    }

    // Administrador tiene acceso irrestricto
    if (req.user.rol_nombre.toLowerCase() === 'administrador') {
      return next();
    }

    if (!req.user.permisos || !req.user.permisos.includes(permissionCode)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Permiso requerido: ${permissionCode}.`
      });
    }

    next();
  };
};
