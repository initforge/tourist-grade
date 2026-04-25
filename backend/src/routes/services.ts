import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, badRequest, notFound } from '../lib/http.js';
import { mapService } from '../lib/mappers.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const serviceSchema = z.object({
  name: z.string().min(2),
  category: z.enum(['Vé tham quan', 'Các dịch vụ khác']),
  unit: z.string().min(1),
  priceMode: z.enum(['Báo giá', 'Giá niêm yết']),
  setup: z.enum(['Giá chung', 'Theo độ tuổi', '-']),
  status: z.enum(['Hoạt động', 'Dừng hoạt động']),
  description: z.string().default(''),
  supplierName: z.string().optional().default(''),
  contactInfo: z.string().optional().default(''),
  province: z.string().optional().default(''),
  formulaCount: z.enum(['Theo ngày', 'Giá trị mặc định', 'Nhập tay']).optional(),
  formulaCountDefault: z.string().optional().default(''),
  formulaQuantity: z.enum(['Theo số người', 'Giá trị mặc định', 'Nhập tay']).optional(),
  formulaQuantityDefault: z.string().optional().default(''),
  unitPrice: z.number().positive().optional(),
});

const priceSchema = z.object({
  unitPrice: z.number().positive(),
  note: z.string().default(''),
  effectiveDate: z.string(),
  endDate: z.string(),
  createdBy: z.string().min(2),
});

function toServiceCategory(value: string) {
  return value === 'Vé tham quan' ? 'ATTRACTION_TICKET' : 'OTHER';
}

function toPriceMode(value: string) {
  return value === 'Báo giá' ? 'QUOTED' : 'LISTED';
}

function toPriceSetup(value: string) {
  if (value === 'Theo độ tuổi') return 'BY_AGE';
  if (value === '-') return 'NONE';
  return 'COMMON';
}

function toFormulaOption(value?: string) {
  if (value === 'Theo ngày') return 'BY_DAY';
  if (value === 'Giá trị mặc định') return 'DEFAULT_VALUE';
  if (value === 'Theo số người') return 'DEFAULT_VALUE';
  if (value === 'Nhập tay') return 'MANUAL';
  return undefined;
}

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
        code: `SV-${Date.now().toString().slice(-6)}`,
        name: input.data.name,
        category: toServiceCategory(input.data.category),
        unit: input.data.unit,
        priceMode: toPriceMode(input.data.priceMode),
        priceSetup: toPriceSetup(input.data.setup),
        status: input.data.status === 'Hoạt động' ? 'ACTIVE' : 'INACTIVE',
        description: input.data.description,
        supplierName: input.data.supplierName || null,
        contactInfo: input.data.contactInfo || null,
        province: input.data.province || null,
        formulaCount: toFormulaOption(input.data.formulaCount),
        formulaCountDefault: input.data.formulaCountDefault || null,
        formulaQuantity: toFormulaOption(input.data.formulaQuantity),
        formulaQuantityDefault: input.data.formulaQuantityDefault || null,
        prices: input.data.unitPrice
          ? {
              create: {
                unitPrice: input.data.unitPrice,
                note: input.data.supplierName ? `Bảng giá khởi tạo - ${input.data.supplierName}` : 'Bảng giá khởi tạo',
                effectiveDate: new Date('2026-01-01'),
                endDate: new Date('2026-12-31'),
                createdByName: 'Điều phối viên',
              },
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
    const id = String(req.params.id);
    const input = serviceSchema.partial().safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid service update payload');
    }

    const existing = await prisma.service.findFirst({
      where: {
        OR: [{ id }, { code: id }],
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
        category: input.data.category ? toServiceCategory(input.data.category) : existing.category,
        unit: input.data.unit ?? existing.unit,
        priceMode: input.data.priceMode ? toPriceMode(input.data.priceMode) : existing.priceMode,
        priceSetup: input.data.setup ? toPriceSetup(input.data.setup) : existing.priceSetup,
        status: input.data.status ? input.data.status === 'Hoạt động' ? 'ACTIVE' : 'INACTIVE' : existing.status,
        description: input.data.description ?? existing.description,
        supplierName: input.data.supplierName === undefined ? existing.supplierName : input.data.supplierName || null,
        contactInfo: input.data.contactInfo === undefined ? existing.contactInfo : input.data.contactInfo || null,
        province: input.data.province === undefined ? existing.province : input.data.province || null,
        formulaCount: input.data.formulaCount === undefined ? existing.formulaCount : toFormulaOption(input.data.formulaCount),
        formulaCountDefault: input.data.formulaCountDefault === undefined ? existing.formulaCountDefault : input.data.formulaCountDefault || null,
        formulaQuantity: input.data.formulaQuantity === undefined ? existing.formulaQuantity : toFormulaOption(input.data.formulaQuantity),
        formulaQuantityDefault: input.data.formulaQuantityDefault === undefined ? existing.formulaQuantityDefault : input.data.formulaQuantityDefault || null,
      },
      include: { prices: true },
    });

    res.json({
      success: true,
      service: mapService(updated),
    });
  }));

  router.post('/:id/prices', asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const input = priceSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid price payload');
    }

    const service = await prisma.service.findFirst({
      where: {
        OR: [{ id }, { code: id }],
      },
    });

    if (!service) {
      throw notFound('Service not found');
    }

    const price = await prisma.servicePrice.create({
      data: {
        serviceId: service.id,
        unitPrice: input.data.unitPrice,
        note: input.data.note,
        effectiveDate: new Date(input.data.effectiveDate),
        endDate: new Date(input.data.endDate),
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
        endDate: price.endDate.toISOString().slice(0, 10),
        createdBy: price.createdByName,
      },
    });
  }));

  return router;
}
