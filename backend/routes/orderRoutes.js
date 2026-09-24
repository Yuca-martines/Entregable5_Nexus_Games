import { Router } from 'express';
import { createOrder, getMyOrders, getAllOrders } from '../controllers/orderController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/roleMiddleware.js';

const router = Router();

router.use(verifyToken);

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/all', requireRoles('Administrador', 'Empleado'), getAllOrders);

export default router;
