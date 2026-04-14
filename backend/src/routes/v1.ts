import { Router } from 'express';

const moduleNames = [
  'auth',
  'users',
  'tour-programs',
  'tour-instances',
  'bookings',
  'vouchers',
  'suppliers',
  'tour-guides',
  'reports',
  'blogs',
] as const;

function notImplemented(moduleName: string) {
  return {
    success: false,
    message: `Module "${moduleName}" has not been implemented yet.`,
    nextStep: 'Follow docs/05-API-CONTRACT.md and docs/09-IMPLEMENTATION-ROADMAP.md',
  };
}

export function createV1Router() {
  const router = Router();

  router.get('/meta', (_req, res) => {
    res.json({
      success: true,
      service: 'travela-api',
      version: 'v1',
      modules: moduleNames,
    });
  });

  moduleNames.forEach((moduleName) => {
    router.all(`/${moduleName}`, (_req, res) => {
      res.status(501).json(notImplemented(moduleName));
    });

    router.all(`/${moduleName}/*`, (_req, res) => {
      res.status(501).json(notImplemented(moduleName));
    });
  });

  return router;
}
