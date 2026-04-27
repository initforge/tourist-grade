import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, badRequest, notFound } from '../lib/http.js';
import { mapSpecialDay } from '../lib/mappers.js';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const specialDaySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  occasion: z.string().min(2),
  startDate: z.string(),
  endDate: z.string(),
  note: z.string().optional().nullable(),
});

export function createSpecialDaysRouter() {
  const router = Router();

  router.use(authenticate, requireRoles('manager', 'admin'));

  router.get('/', asyncHandler(async (_req, res) => {
    const items = await prisma.specialDay.findMany({
      orderBy: { startDate: 'asc' },
    });

    res.json({
      success: true,
      specialDays: items.map(mapSpecialDay),
    });
  }));

  router.post('/', asyncHandler(async (req, res) => {
    const input = specialDaySchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid special day payload');
    }

    const count = await prisma.specialDay.count();
    const code = input.data.id || `SD${String(count + 1).padStart(3, '0')}`;
    const created = await prisma.specialDay.create({
      data: {
        code,
        name: input.data.name.trim(),
        occasion: input.data.occasion.trim(),
        startDate: new Date(input.data.startDate),
        endDate: new Date(input.data.endDate),
        note: input.data.note?.trim() || null,
      },
    });

    res.status(201).json({
      success: true,
      specialDay: mapSpecialDay(created),
    });
  }));

  router.patch('/:id', asyncHandler(async (req, res) => {
    const input = specialDaySchema.partial().safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid special day payload');
    }

    const existing = await prisma.specialDay.findFirst({
      where: {
        OR: [{ id: String(req.params.id) }, { code: String(req.params.id) }],
      },
    });

    if (!existing) {
      throw notFound('Special day not found');
    }

    const updated = await prisma.specialDay.update({
      where: { id: existing.id },
      data: {
        name: input.data.name?.trim() ?? existing.name,
        occasion: input.data.occasion?.trim() ?? existing.occasion,
        startDate: input.data.startDate ? new Date(input.data.startDate) : existing.startDate,
        endDate: input.data.endDate ? new Date(input.data.endDate) : existing.endDate,
        note: input.data.note === undefined ? existing.note : input.data.note?.trim() || null,
      },
    });

    res.json({
      success: true,
      specialDay: mapSpecialDay(updated),
    });
  }));

  router.delete('/:id', asyncHandler(async (req, res) => {
    const existing = await prisma.specialDay.findFirst({
      where: {
        OR: [{ id: String(req.params.id) }, { code: String(req.params.id) }],
      },
    });

    if (!existing) {
      throw notFound('Special day not found');
    }

    await prisma.specialDay.delete({
      where: { id: existing.id },
    });

    res.json({ success: true });
  }));

  return router;
}
