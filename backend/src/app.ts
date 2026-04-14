import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { createV1Router } from './routes/v1.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      service: 'travela-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/v1', createV1Router());

  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
    });
  });

  return app;
}
