import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './config/db.js';

// Importar Rutas
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares Globales
app.use(cors({
  origin: '*', // Permitir conexión desde Vite Frontend en cualquier puerto
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inicialización de la Base de Datos Relacional SQL
await initDB();

// Rutas de la API REST
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/orders', orderRoutes);

// Ruta de Verificación de Estado (Health Check)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    project: 'Nexus Games API - React + Node.js + SQL (Tercer Entregable)',
    timestamp: new Date().toISOString()
  });
});

// Manejador de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error('Error no capturado:', err);
  res.status(500).json({
    success: false,
    message: 'Ocurrió un error inesperado en el servidor.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar Servidor
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 SERVIDOR BACKEND ACTIVO EN: http://localhost:${PORT}`);
  console.log(`📦 Base de Datos SQL: SQLite (Lista para Entrega)`);
  console.log(`🔑 Autenticación: JWT + Hashing Bcrypt`);
  console.log(`=======================================================`);
});
