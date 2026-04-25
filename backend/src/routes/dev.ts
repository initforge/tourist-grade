import { Router } from 'express';
import { env } from '../config/env.js';
import { asyncHandler } from '../lib/http.js';
import { resetBookingFixtures, resetTourWorkflowFixtures, resetVoucherFixtures } from '../lib/booking-fixtures.js';
import { prisma } from '../lib/prisma.js';

export function createDevRouter() {
  const router = Router();

  router.post('/reset-booking-fixtures', asyncHandler(async (_req, res) => {
    if (env.NODE_ENV === 'production') {
      res.status(404).json({ success: false, message: 'Route not found' });
      return;
    }

    await resetBookingFixtures(prisma);
    await resetTourWorkflowFixtures(prisma);
    await resetVoucherFixtures(prisma);

    res.json({
      success: true,
      reset: 'sales-fixtures',
    });
  }));

  return router;
}
