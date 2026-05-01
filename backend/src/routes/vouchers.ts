import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, badRequest, notFound } from '../lib/http.js';
import { mapVoucher } from '../lib/mappers.js';
import { authenticate, requireRoles, type AuthenticatedRequest } from '../middleware/auth.js';

const voucherPayloadSchema = z.object({
  code: z.string().min(2).optional(),
  type: z.enum(['percent', 'fixed']).optional(),
  value: z.union([z.string(), z.number()]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  expiryDate: z.string().optional(),
  limit: z.number().int().positive().optional(),
  used: z.number().int().min(0).optional(),
  applicableTours: z.array(z.string()).optional(),
  status: z.enum(['draft', 'pending_approval', 'rejected', 'active', 'inactive', 'upcoming']).optional(),
  rejectionReason: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

const rejectSchema = z.object({
  reason: z.string().min(2),
});

const VOUCHER_OVERDUE_REJECTION_REASON = 'Quá hạn gửi phê duyệt';

function parseVoucherValue(value: string | number | undefined) {
  if (typeof value === 'number') {
    return value;
  }

  if (!value) {
    return undefined;
  }

  const numeric = Number(value.replace(/\D/g, ''));
  return Number.isFinite(numeric) ? numeric : undefined;
}

function toVoucherStatus(status: string | undefined) {
  if (!status) {
    return undefined;
  }

  if (status === 'pending_approval') return 'PENDING_APPROVAL';
  return status.toUpperCase() as 'DRAFT' | 'PENDING_APPROVAL' | 'REJECTED' | 'UPCOMING' | 'ACTIVE' | 'INACTIVE';
}

function getVoucherApprovalDeadlineCutoff(now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() + 7);
  return cutoff;
}

async function rejectOverdueDraftVouchers() {
  await prisma.voucher.updateMany({
    where: {
      status: 'DRAFT',
      startsAt: { lt: getVoucherApprovalDeadlineCutoff() },
    },
    data: {
      status: 'REJECTED',
      rejectionReason: VOUCHER_OVERDUE_REJECTION_REASON,
    },
  });
}

async function resolveProgramIds(codes: string[] | undefined) {
  if (!codes) {
    return undefined;
  }

  if (codes.length === 0) {
    return [];
  }

  const programs = await prisma.tourProgram.findMany({
    where: {
      OR: [
        { code: { in: codes } },
        { id: { in: codes } },
      ],
    },
    select: { id: true },
  });

  return programs.map((program) => program.id);
}

export function createVouchersRouter() {
  const router = Router();

  router.use(authenticate, requireRoles('sales', 'manager', 'coordinator', 'admin'));

  router.get('/', asyncHandler(async (_req, res) => {
    await rejectOverdueDraftVouchers();

    const vouchers = await prisma.voucher.findMany({
      include: {
        targets: {
          include: { tourProgram: { select: { code: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      vouchers: vouchers.map(mapVoucher),
    });
  }));

  router.post('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
    const input = voucherPayloadSchema.required({
      code: true,
      type: true,
      value: true,
      startDate: true,
      endDate: true,
      limit: true,
    }).safeParse(req.body);

    if (!input.success) {
      throw badRequest('Invalid voucher payload');
    }

    const valueAmount = parseVoucherValue(input.data.value);
    if (valueAmount == null) {
      throw badRequest('Invalid voucher value');
    }

    const programIds = await resolveProgramIds(input.data.applicableTours);
    const voucher = await prisma.voucher.create({
      data: {
        code: input.data.code.toUpperCase(),
        type: input.data.type === 'percent' ? 'PERCENT' : 'FIXED',
        valueAmount,
        startsAt: new Date(input.data.startDate),
        endsAt: new Date(input.data.endDate),
        usageLimit: input.data.limit,
        usedCount: input.data.used ?? 0,
        status: toVoucherStatus(input.data.status) ?? 'DRAFT',
        description: input.data.description ?? null,
        rejectionReason: input.data.rejectionReason ?? null,
        createdById: req.auth!.sub,
        targets: programIds && programIds.length > 0
          ? { create: programIds.map((tourProgramId) => ({ tourProgramId })) }
          : undefined,
      },
      include: {
        targets: {
          include: { tourProgram: { select: { code: true } } },
        },
      },
    });

    res.status(201).json({
      success: true,
      voucher: mapVoucher(voucher),
    });
  }));

  router.patch('/:id', asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const input = voucherPayloadSchema.safeParse(req.body);

    if (!input.success) {
      throw badRequest('Invalid voucher update payload');
    }

    const existing = await prisma.voucher.findUnique({
      where: { id },
    });

    if (!existing) {
      throw notFound('Voucher not found');
    }

    const valueAmount = parseVoucherValue(input.data.value);
    const programIds = await resolveProgramIds(input.data.applicableTours);

    const voucher = await prisma.$transaction(async (tx) => {
      if (programIds) {
        await tx.voucherTarget.deleteMany({ where: { voucherId: id } });
      }

      return tx.voucher.update({
        where: { id },
        data: {
          code: input.data.code?.toUpperCase() ?? existing.code,
          type: input.data.type ? input.data.type === 'percent' ? 'PERCENT' : 'FIXED' : existing.type,
          valueAmount: valueAmount ?? existing.valueAmount,
          startsAt: input.data.startDate ? new Date(input.data.startDate) : existing.startsAt,
          endsAt: input.data.endDate || input.data.expiryDate ? new Date(input.data.endDate ?? input.data.expiryDate!) : existing.endsAt,
          usageLimit: input.data.limit ?? existing.usageLimit,
          usedCount: input.data.used ?? existing.usedCount,
          status: toVoucherStatus(input.data.status) ?? existing.status,
          description: input.data.description === undefined ? existing.description : input.data.description,
          rejectionReason: input.data.rejectionReason === undefined ? existing.rejectionReason : input.data.rejectionReason,
          targets: programIds && programIds.length > 0
            ? { create: programIds.map((tourProgramId) => ({ tourProgramId })) }
            : undefined,
        },
        include: {
          targets: {
            include: { tourProgram: { select: { code: true } } },
          },
        },
      });
    });

    res.json({
      success: true,
      voucher: mapVoucher(voucher),
    });
  }));

  router.post('/:id/approve', requireRoles('manager', 'admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
    const id = String(req.params.id);
    const existing = await prisma.voucher.findUnique({ where: { id } });
    if (!existing) {
      throw notFound('Voucher not found');
    }

    const nowKey = new Date().toISOString().slice(0, 10);
    const startKey = existing.startsAt.toISOString().slice(0, 10);
    const voucher = await prisma.voucher.update({
      where: { id },
      data: {
        status: startKey > nowKey ? 'UPCOMING' : 'ACTIVE',
        approvedById: req.auth!.sub,
        rejectedById: null,
        rejectionReason: null,
      },
      include: {
        targets: {
          include: { tourProgram: { select: { code: true } } },
        },
      },
    });

    res.json({ success: true, voucher: mapVoucher(voucher) });
  }));

  router.post('/:id/reject', requireRoles('manager', 'admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
    const id = String(req.params.id);
    const input = rejectSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Rejection reason is required');
    }

    const existing = await prisma.voucher.findUnique({ where: { id } });
    if (!existing) {
      throw notFound('Voucher not found');
    }

    const voucher = await prisma.voucher.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedById: req.auth!.sub,
        rejectionReason: input.data.reason,
      },
      include: {
        targets: {
          include: { tourProgram: { select: { code: true } } },
        },
      },
    });

    res.json({ success: true, voucher: mapVoucher(voucher) });
  }));

  router.delete('/:id', requireRoles('sales', 'admin'), asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const existing = await prisma.voucher.findUnique({ where: { id } });
    if (!existing) {
      throw notFound('Voucher not found');
    }

    await prisma.voucher.delete({ where: { id } });
    res.json({ success: true });
  }));

  return router;
}
