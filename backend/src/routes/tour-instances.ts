import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, badRequest, notFound } from '../lib/http.js';
import { mapTourInstance } from '../lib/mappers.js';
import { toPrismaJson, unwrapEstimatePayload, wrapEstimatePayload } from '../lib/coordinator.js';
import { queueEmail } from '../lib/email-outbox.js';
import { authenticate, requireRoles, type AuthenticatedRequest } from '../middleware/auth.js';

const estimateSchema = z.object({
  costEstimate: z.record(z.string(), z.any()).optional(),
  submit: z.boolean().optional(),
}).passthrough();

const settlementSchema = z.object({
  settlement: z.record(z.string(), z.any()).optional(),
  complete: z.boolean().optional(),
}).passthrough();

const reasonSchema = z.object({
  reason: z.string().min(2),
});

const extendSchema = z.object({
  bookingDeadline: z.string(),
});

const assignGuideSchema = z.object({
  assignedGuide: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email().optional().or(z.literal('')),
  }).nullable(),
  guidePacket: z.object({
    commonFileName: z.string(),
    commonFileContent: z.string(),
    passengerFileName: z.string(),
    passengerFileContent: z.string(),
  }).optional(),
});

const instanceUpsertSchema = z.object({
  id: z.string().optional(),
  programId: z.string(),
  programName: z.string(),
  departureDate: z.string(),
  status: z.enum([
    'cho_duyet_ban',
    'yeu_cau_chinh_sua',
    'tu_choi_ban',
    'dang_mo_ban',
    'chua_du_kien',
    'da_huy',
    'cho_nhan_dieu_hanh',
    'cho_du_toan',
    'cho_duyet_du_toan',
    'san_sang_trien_khai',
    'dang_trien_khai',
    'cho_quyet_toan',
    'hoan_thanh',
  ]).optional(),
  departurePoint: z.string(),
  sightseeingSpots: z.array(z.string()),
  transport: z.enum(['xe', 'maybay']),
  arrivalPoint: z.string().optional().nullable(),
  expectedGuests: z.number().int().min(1),
  priceAdult: z.number(),
  priceChild: z.number(),
  priceInfant: z.number().optional().nullable(),
  minParticipants: z.number().int().min(1),
  bookingDeadline: z.string(),
  warningDate: z.string().optional(),
  saleRequest: z.object({
    id: z.string(),
    code: z.string().optional(),
    createdAt: z.string().optional(),
    totalRows: z.number().int().min(1).optional(),
    selectedRows: z.number().int().min(0).optional(),
    unselectedRows: z.number().int().min(0).optional(),
  }).optional(),
  warningState: z.record(z.string(), z.any()).optional(),
  cancelReason: z.string().optional().nullable(),
  createdAt: z.string().optional(),
}).passthrough();

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

  router.post('/', requireRoles('coordinator', 'manager', 'admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
    const input = instanceUpsertSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid tour instance payload');
    }

    const program = await prisma.tourProgram.findFirst({
      where: {
        OR: [{ id: input.data.programId }, { code: input.data.programId }],
      },
    });

    if (!program) {
      throw notFound('Tour program not found');
    }

    const created = await prisma.tourInstance.create({
      include: tourInstanceInclude,
      data: {
        code: input.data.id ?? `REQ-${program.code}-${input.data.departureDate}`,
        program: { connect: { id: program.id } },
        programNameSnapshot: input.data.programName || program.name,
        departureDate: new Date(input.data.departureDate),
        bookingDeadlineAt: new Date(input.data.bookingDeadline),
        status: mapInstanceStatus(input.data.status ?? 'cho_duyet_ban'),
        departurePoint: input.data.departurePoint,
        arrivalPoint: input.data.arrivalPoint || null,
        sightseeingSpots: toPrismaJson(input.data.sightseeingSpots),
        transport: input.data.transport === 'maybay' ? 'MAYBAY' : 'XE',
        expectedGuests: input.data.expectedGuests,
        minParticipants: input.data.minParticipants,
        priceAdult: input.data.priceAdult,
        priceChild: input.data.priceChild,
        priceInfant: input.data.priceInfant ?? null,
        warningDate: input.data.warningDate ? new Date(input.data.warningDate) : null,
        costEstimateJson: input.data.saleRequest || input.data.warningState
          ? toPrismaJson(wrapEstimatePayload(null, null, {
              saleRequest: input.data.saleRequest,
              warningState: input.data.warningState,
            }))
          : undefined,
        cancelReason: input.data.cancelReason || null,
        createdBy: { connect: { id: req.auth!.sub } },
        submittedAt: new Date(),
      },
    });

    res.status(201).json({ success: true, tourInstance: mapTourInstance(created) });
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

  router.patch('/:id', requireRoles('coordinator', 'manager', 'admin'), asyncHandler(async (req, res) => {
    const input = instanceUpsertSchema.partial().safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid tour instance payload');
    }

    const existing = await prisma.tourInstance.findFirst({
      include: tourInstanceInclude,
      where: { OR: [{ id: String(req.params.id) }, { code: String(req.params.id) }] },
    });

    if (!existing) {
      throw notFound('Tour instance not found');
    }

    const updated = await prisma.tourInstance.update({
      include: tourInstanceInclude,
      where: { id: existing.id },
      data: {
        programNameSnapshot: input.data.programName ?? existing.programNameSnapshot,
        departureDate: input.data.departureDate ? new Date(input.data.departureDate) : existing.departureDate,
        bookingDeadlineAt: input.data.bookingDeadline ? new Date(input.data.bookingDeadline) : existing.bookingDeadlineAt,
        status: input.data.status ? mapInstanceStatus(input.data.status) : existing.status,
        departurePoint: input.data.departurePoint ?? existing.departurePoint,
        arrivalPoint: input.data.arrivalPoint === undefined ? existing.arrivalPoint : (input.data.arrivalPoint || null),
        sightseeingSpots: input.data.sightseeingSpots ? toPrismaJson(input.data.sightseeingSpots) : undefined,
        transport: input.data.transport ? (input.data.transport === 'maybay' ? 'MAYBAY' : 'XE') : existing.transport,
        expectedGuests: input.data.expectedGuests ?? existing.expectedGuests,
        minParticipants: input.data.minParticipants ?? existing.minParticipants,
        priceAdult: input.data.priceAdult ?? existing.priceAdult,
        priceChild: input.data.priceChild ?? existing.priceChild,
        priceInfant: input.data.priceInfant === undefined ? existing.priceInfant : input.data.priceInfant,
        warningDate: input.data.warningDate === undefined
          ? existing.warningDate
          : (input.data.warningDate ? new Date(input.data.warningDate) : null),
        costEstimateJson: input.data.saleRequest || input.data.warningState
          ? toPrismaJson(wrapEstimatePayload(
              unwrapEstimatePayload(existing.costEstimateJson ?? undefined).estimate,
              unwrapEstimatePayload(existing.costEstimateJson ?? undefined).assignedGuide,
              {
                saleRequest: input.data.saleRequest ?? unwrapEstimatePayload(existing.costEstimateJson ?? undefined).saleRequest,
                warningState: input.data.warningState ?? unwrapEstimatePayload(existing.costEstimateJson ?? undefined).warningState,
              },
            ))
          : undefined,
        cancelReason: input.data.cancelReason === undefined ? existing.cancelReason : (input.data.cancelReason || null),
      },
    });

    res.json({ success: true, tourInstance: mapTourInstance(updated) });
  }));

  router.delete('/:id', requireRoles('coordinator', 'manager', 'admin'), asyncHandler(async (req, res) => {
    const existing = await prisma.tourInstance.findFirst({
      where: { OR: [{ id: String(req.params.id) }, { code: String(req.params.id) }] },
    });

    if (!existing) {
      throw notFound('Tour instance not found');
    }

    await prisma.tourInstance.delete({
      where: { id: existing.id },
    });

    res.json({ success: true });
  }));

  router.post('/:id/receive', requireRoles('coordinator', 'admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
    const existing = await getInstance(String(req.params.id));
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

  router.post('/:id/assign-guide', requireRoles('coordinator', 'admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
    const input = assignGuideSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid guide assignment payload');
    }

    const existing = await getInstance(String(req.params.id));
    if (!existing) {
      throw notFound('Tour instance not found');
    }

    const wrapped = unwrapEstimatePayload(existing.costEstimateJson ?? undefined);
    const updated = await prisma.tourInstance.update({
      include: tourInstanceInclude,
      where: { id: existing.id },
      data: {
        costEstimateJson: toPrismaJson(wrapEstimatePayload(wrapped.estimate, input.data.assignedGuide, {
          saleRequest: wrapped.saleRequest,
          warningState: wrapped.warningState,
        })),
      },
    });

    const assignedGuide = input.data.assignedGuide;
    const guideEmail = assignedGuide?.email?.trim();
    if (assignedGuide && guideEmail && input.data.guidePacket) {
      await queueEmail(prisma, {
        template: 'guide_assignment',
        recipient: guideEmail,
        subject: `Phân công HDV tour ${existing.code}`,
        payload: {
          tourCode: existing.code,
          tourName: existing.programNameSnapshot,
          tourDate: existing.departureDate.toISOString().slice(0, 10),
          guideName: assignedGuide.name,
          commonFileName: input.data.guidePacket.commonFileName,
          commonFileContent: input.data.guidePacket.commonFileContent,
          passengerFileName: input.data.guidePacket.passengerFileName,
          passengerFileContent: input.data.guidePacket.passengerFileContent,
        },
        createdById: req.auth?.sub ?? null,
      });
    }

    res.json({ success: true, tourInstance: mapTourInstance(updated) });
  }));

  router.post('/:id/estimate', requireRoles('coordinator', 'admin'), asyncHandler(async (req, res) => {
    const input = estimateSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid estimate payload');
    }

    const existing = await getInstance(String(req.params.id));
    if (!existing) {
      throw notFound('Tour instance not found');
    }

    const estimate = input.data.costEstimate ?? req.body;
    const wrapped = unwrapEstimatePayload(existing.costEstimateJson ?? undefined);
    const shouldSubmit = Boolean(input.data.submit);
    const updated = await prisma.tourInstance.update({
      include: tourInstanceInclude,
      where: { id: existing.id },
      data: {
        status: shouldSubmit ? 'CHO_DUYET_DU_TOAN' : existing.status,
        costEstimateJson: toPrismaJson(wrapEstimatePayload(estimate, wrapped.assignedGuide, {
          saleRequest: wrapped.saleRequest,
          warningState: wrapped.warningState,
        })),
        estimatedAt: new Date(),
      },
    });

    res.json({ success: true, tourInstance: mapTourInstance(updated) });
  }));

  router.post('/:id/estimate/approve', requireRoles('manager', 'admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
    const existing = await getInstance(String(req.params.id));
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

  router.post('/:id/estimate/request-edit', requireRoles('manager', 'admin'), asyncHandler(async (req, res) => {
    const input = reasonSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Edit request reason is required');
    }

    const existing = await getInstance(String(req.params.id));
    if (!existing) {
      throw notFound('Tour instance not found');
    }

    const updated = await prisma.tourInstance.update({
      include: tourInstanceInclude,
      where: { id: existing.id },
      data: {
        status: 'CHO_DU_TOAN',
        cancelReason: input.data.reason,
      },
    });

    res.json({ success: true, tourInstance: mapTourInstance(updated) });
  }));

  router.post('/:id/estimate/reject', requireRoles('manager', 'admin'), asyncHandler(async (req, res) => {
    const input = reasonSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Rejection reason is required');
    }

    const existing = await getInstance(String(req.params.id));
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

  router.post('/:id/settlement', requireRoles('coordinator', 'admin'), asyncHandler(async (req, res) => {
    const input = settlementSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid settlement payload');
    }

    const existing = await getInstance(String(req.params.id));
    if (!existing) {
      throw notFound('Tour instance not found');
    }

    const settlement = input.data.settlement ?? req.body;
    const complete = Boolean(input.data.complete);
    const updated = await prisma.tourInstance.update({
      include: tourInstanceInclude,
      where: { id: existing.id },
      data: {
        status: complete ? 'HOAN_THANH' : existing.status,
        settlementJson: toJsonInput(settlement),
        settledAt: complete ? new Date() : existing.settledAt,
      },
    });

    res.json({ success: true, tourInstance: mapTourInstance(updated) });
  }));

  router.post('/:id/cancel', requireRoles('manager', 'coordinator', 'admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
    const input = reasonSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Cancellation reason is required');
    }

    const existing = await getInstance(String(req.params.id));
    if (!existing) {
      throw notFound('Tour instance not found');
    }

    const now = new Date();
    const normalizedReason = normalizeManagerCancellationReason(input.data.reason);
    const actorName = req.auth?.name ?? 'Quản lý';

    const updated = await prisma.$transaction(async (tx) => {
      const activeBookings = await tx.booking.findMany({
        where: {
          tourInstanceId: existing.id,
          status: { in: ['PENDING', 'PENDING_CANCEL', 'CONFIRMED'] },
        },
      });

      let refundTotal = 0;

      for (const booking of activeBookings) {
        const refundAmount = Number(booking.paidAmount);
        refundTotal += refundAmount;
        const existingPayload = ((booking.payloadJson as Record<string, unknown> | null) ?? {});

        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: 'CANCELLED',
            refundStatus: refundAmount > 0 ? 'PENDING' : 'REFUNDED',
            cancellationReason: normalizedReason,
            cancelledAt: now,
            refundAmount,
            cancelledConfirmedById: req.auth?.sub ?? booking.cancelledConfirmedById,
            cancelledConfirmedAt: now,
            payloadJson: {
              ...existingPayload,
              cancelledConfirmedBy: actorName,
              cancelledConfirmedAt: now.toISOString(),
              cancellationSource: 'manager_tour_cancel',
            } satisfies Prisma.InputJsonObject,
          },
        });

        await queueEmail(tx, {
          template: 'booking_cancel_confirmed',
          recipient: booking.contactEmail,
          subject: `Thong bao huy tour ${booking.bookingCode}`,
          bookingId: booking.id,
          createdById: req.auth?.sub,
          payload: {
            bookingCode: booking.bookingCode,
            tourName: existing.programNameSnapshot,
            tourDate: existing.departureDate.toISOString().slice(0, 10),
            contact: {
              name: booking.contactName,
              email: booking.contactEmail,
              phone: booking.contactPhone,
            },
            cancellationReason: normalizedReason,
            cancellationSource: 'manager_tour_cancel',
            refundAmount,
            cancelledConfirmedBy: actorName,
            cancelledConfirmedAt: now.toISOString(),
          },
        });
      }

      return tx.tourInstance.update({
        include: tourInstanceInclude,
        where: { id: existing.id },
        data: {
          status: 'DA_HUY',
          cancelReason: normalizedReason,
          cancelledAt: now,
          refundTotal,
        },
      });
    });

    res.json({ success: true, tourInstance: mapTourInstance(updated) });
  }));

  router.post('/:id/approve-sale', requireRoles('manager', 'admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
    const existing = await getInstance(String(req.params.id));
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
    const input = reasonSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Rejection reason is required');
    }

    const existing = await getInstance(String(req.params.id));
    if (!existing) {
      throw notFound('Tour instance not found');
    }

    const updated = await prisma.tourInstance.update({
      include: tourInstanceInclude,
      where: { id: existing.id },
      data: {
        status: 'TU_CHOI_BAN',
        cancelReason: input.data.reason,
      },
    });

    res.json({ success: true, tourInstance: mapTourInstance(updated) });
  }));

  router.post('/:id/request-edit-sale', requireRoles('manager', 'admin'), asyncHandler(async (req, res) => {
    const input = reasonSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Edit request reason is required');
    }

    const existing = await getInstance(String(req.params.id));
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
    const input = extendSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid deadline payload');
    }

    const existing = await getInstance(String(req.params.id));
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

  router.post('/:id/continue-insufficient', requireRoles('manager', 'admin'), asyncHandler(async (req, res) => {
    const existing = await getInstance(String(req.params.id));
    if (!existing) {
      throw notFound('Tour instance not found');
    }

    const updated = await prisma.tourInstance.update({
      include: tourInstanceInclude,
      where: { id: existing.id },
      data: {
        status: 'CHO_NHAN_DIEU_HANH',
      },
    });

    res.json({ success: true, tourInstance: mapTourInstance(updated) });
  }));

  return router;
}

async function getInstance(id: string) {
  return prisma.tourInstance.findFirst({
    include: tourInstanceInclude,
    where: { OR: [{ id }, { code: id }] },
  });
}

function mapInstanceStatus(status: z.infer<typeof instanceUpsertSchema>['status']) {
  switch (status) {
    case 'yeu_cau_chinh_sua': return 'YEU_CAU_CHINH_SUA';
    case 'tu_choi_ban': return 'TU_CHOI_BAN';
    case 'dang_mo_ban': return 'DANG_MO_BAN';
    case 'chua_du_kien': return 'CHUA_DU_KIEN';
    case 'da_huy': return 'DA_HUY';
    case 'cho_nhan_dieu_hanh': return 'CHO_NHAN_DIEU_HANH';
    case 'cho_du_toan': return 'CHO_DU_TOAN';
    case 'cho_duyet_du_toan': return 'CHO_DUYET_DU_TOAN';
    case 'san_sang_trien_khai': return 'SAN_SANG_TRIEN_KHAI';
    case 'dang_trien_khai': return 'DANG_TRIEN_KHAI';
    case 'cho_quyet_toan': return 'CHO_QUYET_TOAN';
    case 'hoan_thanh': return 'HOAN_THANH';
    case 'cho_duyet_ban':
    default:
      return 'CHO_DUYET_BAN';
  }
}

function normalizeManagerCancellationReason(reason: string) {
  const normalized = reason
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  return 'Bất khả kháng';
}
