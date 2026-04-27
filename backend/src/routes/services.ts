import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, badRequest, notFound } from '../lib/http.js';
import { mapService } from '../lib/mappers.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { OPEN_ENDED_DATE, toRequiredDate } from '../lib/coordinator.js';

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

    const service = await prisma.service.create({
      data: {
        code: input.data.code ?? `SV-${Date.now().toString().slice(-6)}`,
        name: input.data.name,
        category: input.data.category,
        unit: input.data.unit,
        priceMode: input.data.priceMode,
        priceSetup: input.data.priceSetup,
        status: input.data.status,
        description: input.data.description || null,
        supplierName: input.data.supplierName || null,
        contactInfo: input.data.contactInfo || null,
        province: input.data.province || null,
        formulaCount: input.data.formulaCount ?? null,
        formulaCountDefault: input.data.formulaCountDefault || null,
        formulaQuantity: input.data.formulaQuantity ?? null,
        formulaQuantityDefault: input.data.formulaQuantityDefault || null,
        prices: input.data.prices.length > 0
          ? {
              create: input.data.prices.map((price) => ({
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

    const updated = await prisma.service.update({
      where: { id: existing.id },
      data: {
        name: input.data.name ?? existing.name,
        category: input.data.category ?? existing.category,
        unit: input.data.unit ?? existing.unit,
        priceMode: input.data.priceMode ?? existing.priceMode,
        priceSetup: input.data.priceSetup ?? existing.priceSetup,
        status: input.data.status ?? existing.status,
        description: input.data.description === undefined ? existing.description : (input.data.description || null),
        supplierName: input.data.supplierName === undefined ? existing.supplierName : (input.data.supplierName || null),
        contactInfo: input.data.contactInfo === undefined ? existing.contactInfo : (input.data.contactInfo || null),
        province: input.data.province === undefined ? existing.province : (input.data.province || null),
        formulaCount: input.data.formulaCount === undefined ? existing.formulaCount : (input.data.formulaCount ?? null),
        formulaCountDefault: input.data.formulaCountDefault === undefined ? existing.formulaCountDefault : (input.data.formulaCountDefault || null),
        formulaQuantity: input.data.formulaQuantity === undefined ? existing.formulaQuantity : (input.data.formulaQuantity ?? null),
        formulaQuantityDefault: input.data.formulaQuantityDefault === undefined ? existing.formulaQuantityDefault : (input.data.formulaQuantityDefault || null),
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
    if (!input.data.endDate) {
      await prisma.servicePrice.updateMany({
        where: {
          serviceId: service.id,
          endDate: OPEN_ENDED_DATE,
        },
        data: {
          endDate: effectiveDate,
        },
      });
    }

    const price = await prisma.servicePrice.create({
      data: {
        serviceId: service.id,
        unitPrice: input.data.unitPrice,
        note: input.data.note,
        effectiveDate,
        endDate: toRequiredDate(input.data.endDate),
        createdByName: input.data.createdBy,
      },
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

  return router;
}
