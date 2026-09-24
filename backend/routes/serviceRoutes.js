import { Router } from 'express';
import {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService
} from '../controllers/serviceController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/roleMiddleware.js';

const router = Router();

// Consulta pública de servicios disponibles
router.get('/', getAllServices);
router.get('/:id', getServiceById);

// Gestión de servicios protegida
router.post('/', verifyToken, requireRoles('Administrador', 'Empleado'), createService);
router.put('/:id', verifyToken, requireRoles('Administrador', 'Empleado'), updateService);
router.delete('/:id', verifyToken, requireRoles('Administrador'), deleteService);

export default router;
