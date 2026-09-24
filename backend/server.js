import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors({
  origin: '*'
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Nexus Games API funcionando en Vercel'
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'Backend funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

export default app;
