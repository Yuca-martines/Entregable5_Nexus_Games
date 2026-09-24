import { Router } from 'express';
import { register, login, getProfile, recoverPassword } from '../controllers/authController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Rutas Públicas de Autenticación
router.post('/register', register);
router.post('/login', login);
router.post('/recover-password', recoverPassword);

// Ruta Protegida de Perfil
router.get('/me', verifyToken, getProfile);

export default router;
