import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

dotenv.config();

const app = express();

// ===============================
// MIDDLEWARES
// ===============================

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// RUTAS
// ===============================

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/orders', orderRoutes);

// ===============================
// HEALTH CHECK
// ===============================

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    project: 'Nexus Games API',
    message: 'Backend funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// ===============================
// RUTA PRINCIPAL
// ===============================

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Nexus Games API funcionando correctamente'
  });
});

// ===============================
// 404
// ===============================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

// ===============================
// MANEJO DE ERRORES
// ===============================

app.use((err, req, res, next) => {
  console.error('Error no capturado:', err);

  res.status(500).json({
    success: false,
    message: 'Ocurrió un error inesperado en el servidor.',
    error: process.env.NODE_ENV === 'development'
      ? err.message
      : undefined
  });
});

// ===============================
// BASE DE DATOS
// ===============================

try {
  await initDB();
  console.log('Base de datos inicializada correctamente');
} catch (error) {
  console.error('Error inicializando la base de datos:', error);
}

// ===============================
// EXPORTAR PARA VERCEL
// ===============================

export default app;
