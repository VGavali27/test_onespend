import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import env from './config/env.js';
import { HTTP_STATUS } from './constants/index.js';

const app = express();

// ---------- Global Middleware ----------
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: '10kb' }));
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
app.use('/api', routes);

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
