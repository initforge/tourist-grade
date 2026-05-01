import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, badRequest, notFound } from '../lib/http.js';
import { mapService } from '../lib/mappers.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { toRequiredDate } from '../lib/coordinator.js';

const priceRowSchema = z.object({
  unitPrice: z.number().positive(),
  note: z.string().optional().default(''),
  effectiveDate: z.string(),
  endDate: z.string().optional().default(''),
  createdBy: z.string().min(2).optional().default('Điều phối viên'),
});

const serviceSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(2),
  category: z.enum(['ATTRACTION_TICKET', 'OTHER']),
  unit: z.string().min(1),
  priceMode: z.enum(['QUOTED', 'LISTED']),
  priceSetup: z.enum(['COMMON', 'BY_AGE', 'NONE']),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  description: z.string().optional().default(''),
  supplierName: z.string().optional().default(''),
  contactInfo: z.string().optional().default(''),
  province: z.string().optional().default(''),
  formulaCount: z.enum(['BY_DAY', 'DEFAULT_VALUE', 'MANUAL']).optional().nullable(),
  formulaCountDefault: z.string().optional().default(''),
  formulaQuantity: z.enum(['BY_DAY', 'DEFAULT_VALUE', 'MANUAL']).optional().nullable(),
  formulaQuantityDefault: z.string().optional().default(''),
  prices: z.array(priceRowSchema).optional().default([]),
});

const priceSchema = priceRowSchema;
type ServiceInput = z.infer<typeof serviceSchema>;

export function createServicesRouter() {
  const router = Router();
  router.use(authenticate, requireRoles('coordinator', 'manager', 'admin'));

  router.get('/', asyncHandler(async (_req, res) => {
    const services = await prisma.service.findMany({
      include: { prices: true },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      success: true,
      services: services.map(mapService),
    });
  }));

  router.post('/', asyncHandler(async (req, res) => {
    const input = serviceSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid service payload');
    }
    const normalized = normalizeServiceInput(input.data);

    const service = await prisma.service.create({
      data: {
        code: normalized.code ?? `SV-${Date.now().toString().slice(-6)}`,
        name: normalized.name,
        category: normalized.category,
        unit: normalized.unit,
        priceMode: normalized.priceMode,
        priceSetup: normalized.priceSetup,
        status: normalized.status,
        description: normalized.description || null,
        supplierName: normalized.supplierName || null,
        contactInfo: normalized.contactInfo || null,
        province: normalized.province || null,
        formulaCount: normalized.formulaCount ?? null,
        formulaCountDefault: normalized.formulaCountDefault || null,
        formulaQuantity: normalized.formulaQuantity ?? null,
        formulaQuantityDefault: normalized.formulaQuantityDefault || null,
        prices: normalized.prices.length > 0
          ? {
              create: normalized.prices.map((price) => ({
                unitPrice: price.unitPrice,
                note: price.note,
                effectiveDate: new Date(price.effectiveDate),
                endDate: toRequiredDate(price.endDate),
                createdByName: price.createdBy,
              })),
            }
          : undefined,
      },
      include: { prices: true },
    });

    res.status(201).json({
      success: true,
      service: mapService(service),
    });
  }));

  router.patch('/:id', asyncHandler(async (req, res) => {
    const input = serviceSchema.partial().safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid service update payload');
    }

    const existing = await prisma.service.findFirst({
      where: {
        OR: [{ id: String(req.params.id) }, { code: String(req.params.id) }],
      },
      include: { prices: true },
    });

    if (!existing) {
      throw notFound('Service not found');
    }

    const merged = normalizeServiceInput({
      code: existing.code,
      name: input.data.name ?? existing.name,
      category: input.data.category ?? existing.category,
      unit: input.data.unit ?? existing.unit,
      priceMode: input.data.priceMode ?? existing.priceMode,
      priceSetup: input.data.priceSetup ?? existing.priceSetup,
      status: input.data.status ?? existing.status,
      description: input.data.description === undefined ? existing.description ?? '' : input.data.description,
      supplierName: input.data.supplierName === undefined ? existing.supplierName ?? '' : input.data.supplierName,
      contactInfo: input.data.contactInfo === undefined ? existing.contactInfo ?? '' : input.data.contactInfo,
      province: input.data.province === undefined ? existing.province ?? '' : input.data.province,
      formulaCount: input.data.formulaCount === undefined ? existing.formulaCount : input.data.formulaCount,
      formulaCountDefault: input.data.formulaCountDefault === undefined ? existing.formulaCountDefault ?? '' : input.data.formulaCountDefault,
      formulaQuantity: input.data.formulaQuantity === undefined ? existing.formulaQuantity : input.data.formulaQuantity,
      formulaQuantityDefault: input.data.formulaQuantityDefault === undefined ? existing.formulaQuantityDefault ?? '' : input.data.formulaQuantityDefault,
      prices: [],
    });

    const updated = await prisma.service.update({
      where: { id: existing.id },
      data: {
        name: merged.name,
        category: merged.category,
        unit: merged.unit,
        priceMode: merged.priceMode,
        priceSetup: merged.priceSetup,
        status: merged.status,
        description: merged.description || null,
        supplierName: merged.supplierName || null,
        contactInfo: merged.contactInfo || null,
        province: merged.province || null,
        formulaCount: merged.formulaCount ?? null,
        formulaCountDefault: merged.formulaCountDefault || null,
        formulaQuantity: merged.formulaQuantity ?? null,
        formulaQuantityDefault: merged.formulaQuantityDefault || null,
      },
      include: { prices: true },
    });

    res.json({
      success: true,
      service: mapService(updated),
    });
  }));

  router.delete('/:id', asyncHandler(async (req, res) => {
    const existing = await prisma.service.findFirst({
      where: {
        OR: [{ id: String(req.params.id) }, { code: String(req.params.id) }],
      },
    });

    if (!existing) {
      throw notFound('Service not found');
    }

    await prisma.service.delete({
      where: { id: existing.id },
    });

    res.json({ success: true });
  }));

  router.post('/:id/prices', asyncHandler(async (req, res) => {
    const input = priceSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid price payload');
    }

    const service = await prisma.service.findFirst({
      where: {
        OR: [{ id: String(req.params.id) }, { code: String(req.params.id) }],
      },
      include: { prices: true },
    });

    if (!service) {
      throw notFound('Service not found');
    }

    const effectiveDate = new Date(input.data.effectiveDate);
    const endDate = toRequiredDate(input.data.endDate);

    const price = await prisma.$transaction(async (tx) => {
      await reconcileServicePriceRanges(tx, service.prices, service.id, effectiveDate, endDate, input.data.note);
      return tx.servicePrice.create({
        data: {
          serviceId: service.id,
          unitPrice: input.data.unitPrice,
          note: input.data.note,
          effectiveDate,
          endDate,
          createdByName: input.data.createdBy,
        },
      });
    });

    res.status(201).json({
      success: true,
      price: {
        id: price.id,
        unitPrice: Number(price.unitPrice),
        note: price.note ?? '',
        effectiveDate: price.effectiveDate.toISOString().slice(0, 10),
        endDate: price.endDate.getUTCFullYear() >= 9999 ? '' : price.endDate.toISOString().slice(0, 10),
        createdBy: price.createdByName,
      },
    });
  }));

  router.patch('/:id/prices/:priceId', asyncHandler(async (req, res) => {
    const input = priceSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid price payload');
    }

    const service = await prisma.service.findFirst({
      where: {
        OR: [{ id: String(req.params.id) }, { code: String(req.params.id) }],
      },
      include: { prices: true },
    });

    if (!service) {
      throw notFound('Service not found');
    }

    const existingPrice = service.prices.find((price) => price.id === String(req.params.priceId));
    if (!existingPrice) {
      throw notFound('Price not found');
    }

    const effectiveDate = new Date(input.data.effectiveDate);
    const endDate = toRequiredDate(input.data.endDate);
    const remainingPrices = service.prices.filter((price) => price.id !== existingPrice.id);

    const price = await prisma.$transaction(async (tx) => {
      await tx.servicePrice.delete({ where: { id: existingPrice.id } });
      await reconcileAdjacentServicePriceRanges(tx, remainingPrices, existingPrice, effectiveDate, endDate, input.data.note);
      await reconcileServicePriceRanges(tx, remainingPrices, service.id, effectiveDate, endDate, input.data.note);
      return tx.servicePrice.create({
        data: {
          id: existingPrice.id,
          serviceId: service.id,
          unitPrice: input.data.unitPrice,
          note: input.data.note,
          effectiveDate,
          endDate,
          createdByName: input.data.createdBy,
        },
      });
    });

    res.json({
      success: true,
      price: {
        id: price.id,
        unitPrice: Number(price.unitPrice),
        note: price.note ?? '',
        effectiveDate: price.effectiveDate.toISOString().slice(0, 10),
        endDate: price.endDate.getUTCFullYear() >= 9999 ? '' : price.endDate.toISOString().slice(0, 10),
        createdBy: price.createdByName,
      },
    });
  }));

  return router;
}

function normalizeServiceInput<T extends Partial<ServiceInput>>(input: T): T {
  if (input.category !== 'ATTRACTION_TICKET') {
    return input;
  }

  return {
    ...input,
    unit: 'Vé',
    priceMode: 'LISTED',
  };
}

type ServicePriceRecord = Awaited<ReturnType<typeof prisma.service.findFirst>> extends infer _T
  ? {
      id: string;
      unitPrice: Prisma.Decimal | number;
      note: string | null;
      effectiveDate: Date;
      endDate: Date;
      createdByName: string;
    }
  : never;

function addUtcDays(date: Date, days: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
}

function dateTime(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function rangesOverlap(oldStart: Date, oldEnd: Date, newStart: Date, newEnd: Date) {
  return dateTime(oldStart) <= dateTime(newEnd) && dateTime(oldEnd) >= dateTime(newStart);
}

function normalizePriceNote(note?: string | null) {
  const normalized = (note ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();
  return normalized === 'khong co' ? '' : normalized;
}

async function reconcileAdjacentServicePriceRanges(
  tx: Prisma.TransactionClient,
  prices: ServicePriceRecord[],
  previousPrice: ServicePriceRecord,
  newStart: Date,
  newEnd: Date,
  newNote?: string | null,
) {
  const targetNote = normalizePriceNote(newNote);
  const previousStart = previousPrice.effectiveDate;
  const previousEnd = previousPrice.endDate;

  if (dateTime(newStart) > dateTime(previousStart)) {
    const oldPreviousEnd = addUtcDays(previousStart, -1);
    const nextPreviousEnd = addUtcDays(newStart, -1);
    const adjacentPrevious = prices.find((price) => (
      normalizePriceNote(price.note) === targetNote
      && dateTime(price.endDate) === dateTime(oldPreviousEnd)
    ));
    if (adjacentPrevious) {
      await tx.servicePrice.updateMany({
        where: { id: adjacentPrevious.id },
        data: { endDate: nextPreviousEnd },
      });
    }
  }

  if (dateTime(newEnd) < dateTime(previousEnd)) {
    const oldNextStart = addUtcDays(previousEnd, 1);
    const nextStart = addUtcDays(newEnd, 1);
    const adjacentNext = prices.find((price) => (
      normalizePriceNote(price.note) === targetNote
      && dateTime(price.effectiveDate) === dateTime(oldNextStart)
    ));
    if (adjacentNext) {
      await tx.servicePrice.updateMany({
        where: { id: adjacentNext.id },
        data: { effectiveDate: nextStart },
      });
    }
  }
}

async function reconcileServicePriceRanges(
  tx: Prisma.TransactionClient,
  prices: ServicePriceRecord[],
  serviceId: string,
  newStart: Date,
  newEnd: Date,
  newNote?: string | null,
) {
  const beforeNewStart = addUtcDays(newStart, -1);
  const afterNewEnd = addUtcDays(newEnd, 1);
  const targetNote = normalizePriceNote(newNote);

  for (const price of prices) {
    if (normalizePriceNote(price.note) !== targetNote) continue;
    const oldStart = price.effectiveDate;
    const oldEnd = price.endDate;
    if (!rangesOverlap(oldStart, oldEnd, newStart, newEnd)) continue;

    if (dateTime(oldStart) >= dateTime(newStart) && dateTime(oldEnd) <= dateTime(newEnd)) {
      await tx.servicePrice.deleteMany({ where: { id: price.id } });
      continue;
    }

    if (dateTime(oldStart) < dateTime(newStart) && dateTime(oldEnd) >= dateTime(newStart) && dateTime(oldEnd) <= dateTime(newEnd)) {
      await tx.servicePrice.updateMany({
        where: { id: price.id },
        data: { endDate: beforeNewStart },
      });
      continue;
    }

    if (dateTime(oldStart) >= dateTime(newStart) && dateTime(oldStart) <= dateTime(newEnd) && dateTime(oldEnd) > dateTime(newEnd)) {
      await tx.servicePrice.updateMany({
        where: { id: price.id },
        data: { effectiveDate: afterNewEnd },
      });
      continue;
    }

    if (dateTime(oldStart) < dateTime(newStart) && dateTime(oldEnd) > dateTime(newEnd)) {
      await tx.servicePrice.updateMany({
        where: { id: price.id },
        data: { endDate: beforeNewStart },
      });
      await tx.servicePrice.create({
        data: {
          serviceId,
          unitPrice: price.unitPrice,
          note: price.note,
          effectiveDate: afterNewEnd,
          endDate: oldEnd,
          createdByName: price.createdByName,
        },
      });
    }
  }
}
