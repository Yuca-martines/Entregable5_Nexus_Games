import { Router } from 'express';
import { getAllRoles, getDashboardStats } from '../controllers/roleController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/roleMiddleware.js';

const router = Router();

router.use(verifyToken);

// Ver roles y permisos del sistema (Admin y Empleado)
router.get('/', requireRoles('Administrador', 'Empleado'), getAllRoles);

// Ver estadísticas generales del sistema (Admin y Empleado)
router.get('/stats', requireRoles('Administrador', 'Empleado'), getDashboardStats);

export default router;
