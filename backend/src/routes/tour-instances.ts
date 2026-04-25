import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, badRequest, notFound } from '../lib/http.js';
import { mapTourInstance } from '../lib/mappers.js';
import { authenticate, requireRoles, type AuthenticatedRequest } from '../middleware/auth.js';

const estimateSchema = z.object({
  costEstimate: z.record(z.string(), z.any()).optional(),
}).passthrough();

const settlementSchema = z.object({
  settlement: z.record(z.string(), z.any()).optional(),
}).passthrough();

const reasonSchema = z.object({
  reason: z.string().min(2),
});

const extendSchema = z.object({
  bookingDeadline: z.string(),
});

const tourInstanceInclude = { program: true } as const;

function toJsonInput(value: unknown) {
  return (value ?? {}) as Prisma.InputJsonValue;
}

export function createTourInstancesRouter() {
  const router = Router();

  router.use(authenticate);

  router.get('/', asyncHandler(async (_req, res) => {
    const instances = await prisma.tourInstance.findMany({
      include: tourInstanceInclude,
      orderBy: { departureDate: 'asc' },
    });

    res.json({
      success: true,
      tourInstances: instances.map(mapTourInstance),
    });
  }));

  router.get('/:id', asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const instance = await prisma.tourInstance.findFirst({
      include: tourInstanceInclude,
      where: {
        OR: [{ id }, { code: id }],
      },
    });

    if (!instance) {
      throw notFound('Tour instance not found');
    }

    res.json({
      success: true,
      tourInstance: mapTourInstance(instance),
    });
  }));

  router.post('/:id/receive', requireRoles('coordinator', 'admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
    const id = String(req.params.id);
    const existing = await prisma.tourInstance.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });

    if (!existing) {
      throw notFound('Tour instance not found');
    }

    const updated = await prisma.tourInstance.update({
      include: tourInstanceInclude,
      where: { id: existing.id },
      data: {
        status: 'CHO_DU_TOAN',
        assignedCoordinatorId: req.auth!.sub,
        receivedAt: new Date(),
      },
    });

    res.json({ success: true, tourInstance: mapTourInstance(updated) });
  }));

  router.post('/:id/estimate', requireRoles('coordinator', 'admin'), asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const input = estimateSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid estimate payload');
    }

    const existing = await prisma.tourInstance.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });

    if (!existing) {
      throw notFound('Tour instance not found');
    }

    const estimate = input.data.costEstimate ?? req.body;
    const updated = await prisma.tourInstance.update({
      include: tourInstanceInclude,
      where: { id: existing.id },
      data: {
        status: 'CHO_DUYET_DU_TOAN',
        costEstimateJson: toJsonInput(estimate),
        estimatedAt: new Date(),
      },
    });

    res.json({ success: true, tourInstance: mapTourInstance(updated) });
  }));

  router.post('/:id/estimate/approve', requireRoles('manager', 'admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
    const id = String(req.params.id);
    const existing = await prisma.tourInstance.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });

    if (!existing) {
      throw notFound('Tour instance not found');
    }

    const updated = await prisma.tourInstance.update({
      include: tourInstanceInclude,
      where: { id: existing.id },
      data: {
        status: 'SAN_SANG_TRIEN_KHAI',
        approvedById: req.auth!.sub,
        estimateApprovedAt: new Date(),
        readyAt: new Date(),
      },
    });

    res.json({ success: true, tourInstance: mapTourInstance(updated) });
  }));

  router.post('/:id/settlement', requireRoles('coordinator', 'admin'), asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const input = settlementSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid settlement payload');
    }

    const existing = await prisma.tourInstance.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });

    if (!existing) {
      throw notFound('Tour instance not found');
    }

    const settlement = input.data.settlement ?? req.body;
    const updated = await prisma.tourInstance.update({
      include: tourInstanceInclude,
      where: { id: existing.id },
      data: {
        status: 'HOAN_THANH',
        settlementJson: toJsonInput(settlement),
        settledAt: new Date(),
      },
    });

    res.json({ success: true, tourInstance: mapTourInstance(updated) });
  }));

  router.post('/:id/cancel', requireRoles('manager', 'coordinator', 'admin'), asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const input = reasonSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Cancellation reason is required');
    }

    const existing = await prisma.tourInstance.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });

    if (!existing) {
      throw notFound('Tour instance not found');
    }

    const updated = await prisma.tourInstance.update({
      include: tourInstanceInclude,
      where: { id: existing.id },
      data: {
        status: 'DA_HUY',
        cancelReason: input.data.reason,
        cancelledAt: new Date(),
      },
    });

    res.json({ success: true, tourInstance: mapTourInstance(updated) });
  }));

  router.post('/:id/approve-sale', requireRoles('manager', 'admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
    const id = String(req.params.id);
    const existing = await prisma.tourInstance.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });

    if (!existing) {
      throw notFound('Tour instance not found');
    }

    const updated = await prisma.tourInstance.update({
      include: tourInstanceInclude,
      where: { id: existing.id },
      data: {
        status: 'DANG_MO_BAN',
        approvedById: req.auth!.sub,
        approvedAt: new Date(),
        openedAt: new Date(),
      },
    });

    res.json({ success: true, tourInstance: mapTourInstance(updated) });
  }));

  router.post('/:id/reject-sale', requireRoles('manager', 'admin'), asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const input = reasonSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Rejection reason is required');
    }

    const existing = await prisma.tourInstance.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });

    if (!existing) {
      throw notFound('Tour instance not found');
    }

    const updated = await prisma.tourInstance.update({
      include: tourInstanceInclude,
      where: { id: existing.id },
      data: {
        status: 'YEU_CAU_CHINH_SUA',
        cancelReason: input.data.reason,
      },
    });

    res.json({ success: true, tourInstance: mapTourInstance(updated) });
  }));

  router.post('/:id/extend-deadline', requireRoles('manager', 'admin'), asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const input = extendSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid deadline payload');
    }

    const existing = await prisma.tourInstance.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });

    if (!existing) {
      throw notFound('Tour instance not found');
    }

    const updated = await prisma.tourInstance.update({
      include: tourInstanceInclude,
      where: { id: existing.id },
      data: {
        bookingDeadlineAt: new Date(input.data.bookingDeadline),
        status: 'DANG_MO_BAN',
      },
    });

    res.json({ success: true, tourInstance: mapTourInstance(updated) });
  }));

  return router;
}
