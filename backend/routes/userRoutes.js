import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser
} from '../controllers/userController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/roleMiddleware.js';

const router = Router();

// Todas las rutas de gestión de usuarios requieren autenticación
router.use(verifyToken);

// Consulta de usuarios: accesible para Administrador y Empleado
router.get('/', requireRoles('Administrador', 'Empleado'), getAllUsers);
router.get('/:id', requireRoles('Administrador', 'Empleado'), getUserById);

// Acciones de modificación administrativa (CRUD completo): exclusivo de Administrador
router.post('/', requireRoles('Administrador'), createUser);
router.put('/:id', requireRoles('Administrador'), updateUser);
router.patch('/:id/status', requireRoles('Administrador'), toggleUserStatus);
router.delete('/:id', requireRoles('Administrador'), deleteUser);

export default router;
