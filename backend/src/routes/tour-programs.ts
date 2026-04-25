import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, badRequest, notFound } from '../lib/http.js';
import { mapTourProgram } from '../lib/mappers.js';
import { authenticate, requireRoles, type AuthenticatedRequest } from '../middleware/auth.js';

const updateTourProgramSchema = z.object({
  name: z.string().min(2).optional(),
  departurePoint: z.string().min(2).optional(),
  sightseeingSpots: z.array(z.string()).optional(),
  duration: z.object({
    days: z.number().int().min(1),
    nights: z.number().int().min(0),
  }).optional(),
  transport: z.enum(['xe', 'maybay']).optional(),
  arrivalPoint: z.string().optional().nullable(),
  tourType: z.enum(['mua_le', 'quanh_nam']).optional(),
  routeDescription: z.string().optional(),
  holiday: z.string().optional().nullable(),
  selectedDates: z.array(z.string()).optional(),
  weekdays: z.array(z.string()).optional(),
  yearRoundStartDate: z.string().optional(),
  yearRoundEndDate: z.string().optional(),
  coverageMonths: z.number().int().min(1).max(12).optional(),
  bookingDeadline: z.number().int().min(1).optional(),
  status: z.enum(['draft', 'active', 'inactive']).optional(),
  inactiveReason: z.string().optional().nullable(),
  itinerary: z.array(z.object({
    day: z.number().int().min(1),
    title: z.string(),
    description: z.string(),
    meals: z.array(z.string()),
  })).optional(),
  pricingConfig: z.record(z.string(), z.any()).optional(),
});

const reasonSchema = z.object({
  reason: z.string().min(2),
});

export function createTourProgramsRouter() {
  const router = Router();

  router.use(authenticate);

  router.get('/', asyncHandler(async (_req, res) => {
    const programs = await prisma.tourProgram.findMany({
      orderBy: { code: 'asc' },
    });

    res.json({
      success: true,
      tourPrograms: programs.map(mapTourProgram),
    });
  }));

  router.get('/:id', asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const program = await prisma.tourProgram.findFirst({
      where: {
        OR: [{ id }, { code: id }],
      },
    });

    if (!program) {
      throw notFound('Tour program not found');
    }

    res.json({
      success: true,
      tourProgram: mapTourProgram(program),
    });
  }));

  router.patch('/:id', requireRoles('coordinator', 'manager'), asyncHandler(async (req: AuthenticatedRequest, res) => {
    const id = String(req.params.id);
    const input = updateTourProgramSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid tour program payload');
    }

    const existing = await prisma.tourProgram.findFirst({
      where: {
        OR: [{ id }, { code: id }],
      },
    });

    if (!existing) {
      throw notFound('Tour program not found');
    }

    const publicContent = (existing.publicContentJson as Record<string, unknown> | null) ?? {};
    const nextPublicContent = {
      ...publicContent,
      selectedDates: input.data.selectedDates ?? publicContent['selectedDates'],
      weekdays: input.data.weekdays ?? publicContent['weekdays'],
      yearRoundStartDate: input.data.yearRoundStartDate ?? publicContent['yearRoundStartDate'],
      yearRoundEndDate: input.data.yearRoundEndDate ?? publicContent['yearRoundEndDate'],
      coverageMonths: input.data.coverageMonths ?? publicContent['coverageMonths'],
      inactiveReason: input.data.inactiveReason ?? publicContent['inactiveReason'],
    };

    const updated = await prisma.tourProgram.update({
      where: { id: existing.id },
      data: {
        name: input.data.name ?? existing.name,
        departurePoint: input.data.departurePoint ?? existing.departurePoint,
        sightseeingSpots: (input.data.sightseeingSpots ?? existing.sightseeingSpots) as Prisma.InputJsonValue,
        durationDays: input.data.duration?.days ?? existing.durationDays,
        durationNights: input.data.duration?.nights ?? existing.durationNights,
        transport: input.data.transport ? input.data.transport === 'xe' ? 'XE' : 'MAYBAY' : existing.transport,
        arrivalPoint: input.data.arrivalPoint === undefined ? existing.arrivalPoint : input.data.arrivalPoint,
        tourType: input.data.tourType ? input.data.tourType === 'mua_le' ? 'MUA_LE' : 'QUANH_NAM' : existing.tourType,
        description: input.data.routeDescription ?? existing.description,
        holidayLabel: input.data.holiday === undefined ? existing.holidayLabel : input.data.holiday,
        bookingDeadline: input.data.bookingDeadline ?? existing.bookingDeadline,
        status: input.data.status ? input.data.status.toUpperCase() as 'DRAFT' | 'ACTIVE' | 'INACTIVE' : existing.status,
        itineraryJson: (input.data.itinerary ?? existing.itineraryJson) as Prisma.InputJsonValue,
        pricingConfigJson: (input.data.pricingConfig ?? existing.pricingConfigJson) as Prisma.InputJsonValue,
        publicContentJson: nextPublicContent as Prisma.InputJsonObject,
        updatedById: req.auth!.sub,
      },
    });

    res.json({
      success: true,
      tourProgram: mapTourProgram(updated),
    });
  }));

  router.post('/:id/approve', requireRoles('manager', 'admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
    const id = String(req.params.id);
    const existing = await prisma.tourProgram.findFirst({
      where: {
        OR: [{ id }, { code: id }],
      },
    });

    if (!existing) {
      throw notFound('Tour program not found');
    }

    const updated = await prisma.tourProgram.update({
      where: { id: existing.id },
      data: {
        status: 'ACTIVE',
        updatedById: req.auth!.sub,
        publicContentJson: {
          ...((existing.publicContentJson as Record<string, unknown> | null) ?? {}),
          rejectionReason: undefined,
        },
      },
    });

    res.json({
      success: true,
      tourProgram: mapTourProgram(updated),
    });
  }));

  router.post('/:id/reject', requireRoles('manager', 'admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
    const id = String(req.params.id);
    const input = reasonSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Rejection reason is required');
    }

    const existing = await prisma.tourProgram.findFirst({
      where: {
        OR: [{ id }, { code: id }],
      },
    });

    if (!existing) {
      throw notFound('Tour program not found');
    }

    const updated = await prisma.tourProgram.update({
      where: { id: existing.id },
      data: {
        status: 'INACTIVE',
        updatedById: req.auth!.sub,
        publicContentJson: {
          ...((existing.publicContentJson as Record<string, unknown> | null) ?? {}),
          inactiveReason: input.data.reason,
          rejectionReason: input.data.reason,
        },
      },
    });

    res.json({
      success: true,
      tourProgram: mapTourProgram(updated),
    });
  }));

  return router;
}
