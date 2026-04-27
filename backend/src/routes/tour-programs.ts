import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, badRequest, notFound } from '../lib/http.js';
import { mapTourProgram } from '../lib/mappers.js';
import { nextCode, slugify, toPrismaJson, toPrismaObject } from '../lib/coordinator.js';
import { authenticate, requireRoles, type AuthenticatedRequest } from '../middleware/auth.js';

const itinerarySchema = z.object({
  day: z.number().int().min(1),
  title: z.string(),
  description: z.string(),
  meals: z.array(z.string()),
  accommodationPoint: z.string().optional().nullable(),
});

const previewRowSchema = z.object({
  id: z.string(),
  departureDate: z.string(),
  endDate: z.string(),
  dayType: z.string(),
  expectedGuests: z.number().int().min(1),
  costPerAdult: z.number(),
  sellPrice: z.number(),
  profitPercent: z.number(),
  bookingDeadline: z.string(),
  conflictLabel: z.string(),
  conflictDetails: z.array(z.string()),
  checked: z.boolean(),
});

const pricingConfigSchema = z.object({
  profitMargin: z.number(),
  taxRate: z.number(),
  otherCostFactor: z.number(),
  netPrice: z.number(),
  sellPriceAdult: z.number(),
  sellPriceChild: z.number(),
  sellPriceInfant: z.number(),
  minParticipants: z.number().int().min(1),
});

const tourProgramSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  departurePoint: z.string().min(2),
  sightseeingSpots: z.array(z.string()).min(1),
  duration: z.object({
    days: z.number().int().min(1),
    nights: z.number().int().min(0),
  }),
  lodgingStandard: z.enum(['2 sao', '3 sao', '4 sao', '5 sao']).optional().nullable(),
  transport: z.enum(['xe', 'maybay']),
  arrivalPoint: z.string().optional().nullable(),
  tourType: z.enum(['mua_le', 'quanh_nam']),
  routeDescription: z.string().default(''),
  holiday: z.string().optional().nullable(),
  selectedDates: z.array(z.string()).optional(),
  weekdays: z.array(z.string()).optional(),
  yearRoundStartDate: z.string().optional().nullable(),
  yearRoundEndDate: z.string().optional().nullable(),
  coverageMonths: z.number().int().min(1).max(12).optional().nullable(),
  bookingDeadline: z.number().int().min(1),
  status: z.enum(['draft', 'active', 'inactive']).optional(),
  inactiveReason: z.string().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
  approvalStatus: z.enum(['pending', 'rejected', 'approved']).optional().nullable(),
  itinerary: z.array(itinerarySchema),
  pricingConfig: pricingConfigSchema,
  draftPricingTables: z.record(z.string(), z.any()).optional(),
  draftManualPricing: z.record(z.string(), z.any()).optional(),
  draftPricingOverrides: z.record(z.string(), z.any()).optional(),
  draftPreviewRows: z.array(previewRowSchema).optional(),
  createdBy: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  submittedAt: z.string().optional(),
  approvedAt: z.string().optional(),
  rejectedAt: z.string().optional(),
});

const patchTourProgramSchema = tourProgramSchema.partial();

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
    const program = await findProgram(String(req.params.id));
    if (!program) {
      throw notFound('Tour program not found');
    }

    res.json({
      success: true,
      tourProgram: mapTourProgram(program),
    });
  }));

  router.post('/', requireRoles('coordinator', 'manager', 'admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
    const input = tourProgramSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid tour program payload');
    }

    const code = input.data.id || nextCode('TP', (await prisma.tourProgram.findMany({
      select: { code: true },
      orderBy: { code: 'asc' },
    })).map((item) => item.code));

    const created = await prisma.tourProgram.create({
      data: buildProgramCreateData(input.data, req.auth!.sub, code),
    });

    res.status(201).json({
      success: true,
      tourProgram: mapTourProgram(created),
    });
  }));

  router.patch('/:id', requireRoles('coordinator', 'manager', 'admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
    const input = patchTourProgramSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid tour program payload');
    }

    const existing = await findProgram(String(req.params.id));
    if (!existing) {
      throw notFound('Tour program not found');
    }

    const updated = await prisma.tourProgram.update({
      where: { id: existing.id },
      data: buildProgramUpdateData(existing, input.data, req.auth!.sub),
    });

    res.json({
      success: true,
      tourProgram: mapTourProgram(updated),
    });
  }));

  router.post('/:id/submit', requireRoles('coordinator', 'manager', 'admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
    const existing = await findProgram(String(req.params.id));
    if (!existing) {
      throw notFound('Tour program not found');
    }

    const publicContent = getProgramPublicContent(existing);
    const now = new Date().toISOString();
    const updated = await prisma.tourProgram.update({
      where: { id: existing.id },
      data: {
        status: 'DRAFT',
        updatedById: req.auth!.sub,
        publicContentJson: toPrismaObject({
          ...publicContent,
          approvalStatus: 'pending',
          rejectionReason: null,
          submittedAt: now,
          rejectedAt: null,
        }),
      },
    });

    res.json({
      success: true,
      tourProgram: mapTourProgram(updated),
    });
  }));

  router.post('/:id/approve', requireRoles('manager', 'admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
    const existing = await findProgram(String(req.params.id));
    if (!existing) {
      throw notFound('Tour program not found');
    }

    const publicContent = getProgramPublicContent(existing);
    const now = new Date().toISOString();
    const updated = await prisma.tourProgram.update({
      where: { id: existing.id },
      data: {
        status: 'ACTIVE',
        updatedById: req.auth!.sub,
        publicContentJson: toPrismaObject({
          ...publicContent,
          approvalStatus: 'approved',
          rejectionReason: null,
          approvedAt: now,
        }),
      },
    });

    res.json({
      success: true,
      tourProgram: mapTourProgram(updated),
    });
  }));

  router.post('/:id/reject', requireRoles('manager', 'admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
    const input = z.object({ reason: z.string().min(2) }).safeParse(req.body);
    if (!input.success) {
      throw badRequest('Rejection reason is required');
    }

    const existing = await findProgram(String(req.params.id));
    if (!existing) {
      throw notFound('Tour program not found');
    }

    const publicContent = getProgramPublicContent(existing);
    const now = new Date().toISOString();
    const updated = await prisma.tourProgram.update({
      where: { id: existing.id },
      data: {
        status: 'DRAFT',
        updatedById: req.auth!.sub,
        publicContentJson: toPrismaObject({
          ...publicContent,
          approvalStatus: 'rejected',
          rejectionReason: input.data.reason,
          rejectedAt: now,
        }),
      },
    });

    res.json({
      success: true,
      tourProgram: mapTourProgram(updated),
    });
  }));

  return router;
}

async function findProgram(id: string) {
  return prisma.tourProgram.findFirst({
    where: {
      OR: [{ id }, { code: id }],
    },
  });
}

function getProgramPublicContent(program: { publicContentJson: Prisma.JsonValue | null }) {
  return ((program.publicContentJson as Record<string, unknown> | null) ?? {});
}

function getProgramPricingPayload(program: { pricingConfigJson: Prisma.JsonValue }) {
  return ((program.pricingConfigJson as Record<string, unknown>) ?? {});
}

function buildProgramPublicContent(
  input: Partial<z.infer<typeof tourProgramSchema>>,
  existing: Record<string, unknown> = {},
) {
  return {
    ...existing,
    selectedDates: input.selectedDates ?? existing.selectedDates ?? [],
    weekdays: input.weekdays ?? existing.weekdays ?? [],
    yearRoundStartDate: input.yearRoundStartDate ?? existing.yearRoundStartDate ?? '',
    yearRoundEndDate: input.yearRoundEndDate ?? existing.yearRoundEndDate ?? '',
    coverageMonths: input.coverageMonths ?? existing.coverageMonths ?? 3,
    inactiveReason: input.inactiveReason ?? existing.inactiveReason ?? null,
    rejectionReason: input.rejectionReason ?? existing.rejectionReason ?? null,
    approvalStatus: input.approvalStatus ?? existing.approvalStatus ?? 'pending',
    lodgingStandard: input.lodgingStandard ?? existing.lodgingStandard ?? null,
    draftPreviewRows: input.draftPreviewRows ?? existing.draftPreviewRows ?? [],
    submittedAt: input.submittedAt ?? existing.submittedAt ?? null,
    approvedAt: input.approvedAt ?? existing.approvedAt ?? null,
    rejectedAt: input.rejectedAt ?? existing.rejectedAt ?? null,
  };
}

function buildProgramPricingPayload(
  input: Partial<z.infer<typeof tourProgramSchema>>,
  existing: Record<string, unknown> = {},
) {
  return {
    pricingConfig: input.pricingConfig ?? existing.pricingConfig ?? existing,
    draftPricingTables: input.draftPricingTables ?? existing.draftPricingTables ?? {},
    draftManualPricing: input.draftManualPricing ?? existing.draftManualPricing ?? {},
    draftPricingOverrides: input.draftPricingOverrides ?? existing.draftPricingOverrides ?? {},
  };
}

function buildProgramCreateData(
  input: z.infer<typeof tourProgramSchema>,
  actorId: string,
  code: string,
): Prisma.TourProgramCreateInput {
  const now = new Date().toISOString();

  return {
    code,
    slug: `${slugify(input.name)}-${code.toLowerCase()}`,
    name: input.name.trim(),
    description: input.routeDescription.trim() || null,
    departurePoint: input.departurePoint,
    arrivalPoint: input.arrivalPoint || null,
    sightseeingSpots: toPrismaJson(input.sightseeingSpots),
    durationDays: input.duration.days,
    durationNights: input.duration.nights,
    transport: input.transport === 'maybay' ? 'MAYBAY' : 'XE',
    tourType: input.tourType === 'mua_le' ? 'MUA_LE' : 'QUANH_NAM',
    holidayLabel: input.holiday || null,
    bookingDeadline: input.bookingDeadline,
    status: mapProgramStatus(input.status),
    itineraryJson: toPrismaJson(input.itinerary.map((item) => ({
      ...item,
      accommodationPoint: item.accommodationPoint || undefined,
    }))),
    pricingConfigJson: toPrismaJson(buildProgramPricingPayload(input)),
    publicContentJson: toPrismaObject(buildProgramPublicContent({
      ...input,
      submittedAt: input.submittedAt ?? now,
    })),
    createdBy: { connect: { id: actorId } },
    updatedBy: { connect: { id: actorId } },
  };
}

function buildProgramUpdateData(
  existing: Prisma.TourProgramGetPayload<Record<string, never>>,
  input: Partial<z.infer<typeof tourProgramSchema>>,
  actorId: string,
): Prisma.TourProgramUpdateInput {
  const currentPublic = getProgramPublicContent(existing);
  const currentPricing = getProgramPricingPayload(existing);

  return {
    slug: input.name ? `${slugify(input.name)}-${existing.code.toLowerCase()}` : existing.slug,
    name: input.name?.trim() ?? existing.name,
    description: input.routeDescription === undefined
      ? existing.description
      : input.routeDescription.trim() || null,
    departurePoint: input.departurePoint ?? existing.departurePoint,
    arrivalPoint: input.arrivalPoint === undefined ? existing.arrivalPoint : (input.arrivalPoint || null),
    sightseeingSpots: input.sightseeingSpots ? toPrismaJson(input.sightseeingSpots) : undefined,
    durationDays: input.duration?.days ?? existing.durationDays,
    durationNights: input.duration?.nights ?? existing.durationNights,
    transport: input.transport ? (input.transport === 'maybay' ? 'MAYBAY' : 'XE') : existing.transport,
    tourType: input.tourType ? (input.tourType === 'mua_le' ? 'MUA_LE' : 'QUANH_NAM') : existing.tourType,
    holidayLabel: input.holiday === undefined ? existing.holidayLabel : (input.holiday || null),
    bookingDeadline: input.bookingDeadline ?? existing.bookingDeadline,
    status: input.status ? mapProgramStatus(input.status) : existing.status,
    itineraryJson: input.itinerary ? toPrismaJson(input.itinerary.map((item) => ({
      ...item,
      accommodationPoint: item.accommodationPoint || undefined,
    }))) : undefined,
    pricingConfigJson: toPrismaJson(buildProgramPricingPayload(input, currentPricing)),
    publicContentJson: toPrismaObject(buildProgramPublicContent(input, currentPublic)),
    updatedBy: { connect: { id: actorId } },
  };
}

function mapProgramStatus(status?: 'draft' | 'active' | 'inactive') {
  if (status === 'active') return 'ACTIVE';
  if (status === 'inactive') return 'INACTIVE';
  return 'DRAFT';
}
