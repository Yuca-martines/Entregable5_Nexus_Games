import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateStock,
  deleteProduct,
  getCategories
} from '../controllers/productController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/roleMiddleware.js';

const router = Router();

// Rutas Públicas (Catálogo de clientes / visitantes)
router.get('/', getAllProducts);
router.get('/categories', getCategories);
router.get('/:id', getProductById);

// Rutas Protegidas de Gestión de Inventario (Administrador y Empleado)
router.post('/', verifyToken, requireRoles('Administrador', 'Empleado'), createProduct);
router.put('/:id', verifyToken, requireRoles('Administrador', 'Empleado'), updateProduct);
router.patch('/:id/stock', verifyToken, requireRoles('Administrador', 'Empleado'), updateStock);

// Eliminación de productos (exclusivo de Administrador)
router.delete('/:id', verifyToken, requireRoles('Administrador'), deleteProduct);

export default router;
