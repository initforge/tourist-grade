import cors from 'cors';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { env } from './config/env.js';
import { createV1Router } from './routes/v1.js';

export function createApp() {
  const app = express();

  app.use(cors({
    origin(origin, callback) {
      if (!origin || env.CORS_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin is not allowed'));
    },
    credentials: true,
  }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      service: 'travela-backend',
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

  app.use((error: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
    const status = error.status ?? 500;

    res.status(status).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  });

  return app;
}
