import { Router } from 'express';
import { createAuthRouter } from './auth.js';
import { createBootstrapRouter } from './bootstrap.js';
import { createBookingsRouter } from './bookings.js';
import { createDevRouter } from './dev.js';
import { createPaymentsRouter } from './payments.js';
import { createPublicRouter } from './public.js';
import { createServicesRouter } from './services.js';
import { createSuppliersRouter } from './suppliers.js';
import { createTourInstancesRouter } from './tour-instances.js';
import { createTourProgramsRouter } from './tour-programs.js';
import { createUsersRouter } from './users.js';
import { createVouchersRouter } from './vouchers.js';

export function createV1Router() {
  const router = Router();

  router.get('/meta', (_req, res) => {
    res.json({
      success: true,
      service: 'travela-backend',
      version: 'v1',
      modules: [
        'auth',
        'bootstrap',
        'public',
        'users',
        'tour-programs',
        'tour-instances',
        'bookings',
        'payments',
        'services',
        'suppliers',
        'vouchers',
      ],
    });
  });

  router.use('/auth', createAuthRouter());
  router.use('/bootstrap', createBootstrapRouter());
  router.use('/public', createPublicRouter());
  router.use('/users', createUsersRouter());
  router.use('/tour-programs', createTourProgramsRouter());
  router.use('/tour-instances', createTourInstancesRouter());
  router.use('/bookings', createBookingsRouter());
  router.use('/payments', createPaymentsRouter());
  router.use('/services', createServicesRouter());
  router.use('/suppliers', createSuppliersRouter());
  router.use('/vouchers', createVouchersRouter());
  router.use('/dev', createDevRouter());

  return router;
}
