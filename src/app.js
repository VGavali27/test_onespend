import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import env from './config/env.js';
import { HTTP_STATUS } from './constants/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// ---------- Global Middleware ----------
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: '10kb' }));

// ---------- Uploaded files (static) ----------
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use(express.urlencoded({ extended: true }));

// ---------- Health Check ----------
app.get('/health', (_req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'API is running',
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// ---------- Routes ----------
app.use('/api/v1', routes);

// ---------- 404 Handler ----------
app.use((_req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: 'Route not found',
  });
});

// ---------- Global Error Handler ----------
app.use(errorHandler);

export default app;
