import { Router } from 'express';
import { z } from 'zod';
import { Gender, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, badRequest, notFound } from '../lib/http.js';
import { mapSupplier, mapTourGuide } from '../lib/mappers.js';
import { nextCode, toRequiredDate } from '../lib/coordinator.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const supplierPriceSchema = z.object({
  fromDate: z.string(),
  toDate: z.string().optional().default(''),
  unitPrice: z.number().positive(),
  note: z.string().optional().default(''),
  createdBy: z.string().min(2),
});

const serviceVariantSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().optional().default(''),
  unit: z.string(),
  quantity: z.number().int().optional().nullable(),
  capacity: z.number().int().optional().nullable(),
  transportType: z.enum(['XE', 'MAYBAY']).optional().nullable(),
  priceMode: z.enum(['QUOTED', 'LISTED']).optional().nullable(),
  menu: z.string().optional().default(''),
  note: z.string().optional().default(''),
  prices: z.array(supplierPriceSchema).default([]),
});

const supplierSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(2),
  email: z.string().optional().default(''),
  address: z.string().optional().default(''),
  type: z.enum(['HOTEL', 'RESTAURANT', 'TRANSPORT']),
  serviceSummary: z.string().optional().default(''),
  operatingArea: z.string().optional().default(''),
  standards: z.array(z.string()).optional().default([]),
  establishedYear: z.number().int().optional().nullable(),
  description: z.string().optional().default(''),
  isActive: z.boolean().default(true),
  services: z.array(serviceVariantSchema).default([]),
  mealServices: z.array(serviceVariantSchema).default([]),
});

const bulkPriceSchema = z.object({
  fromDate: z.string(),
  toDate: z.string().optional().default(''),
  note: z.string().optional().default(''),
  createdBy: z.string().min(2).optional().default('Điều phối viên'),
  priceMap: z.record(z.string(), z.number().positive()),
});

const guideSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(2),
  gender: z.enum(['Nam', 'Nữ']),
  dob: z.string(),
  phone: z.string().min(2),
  email: z.string().optional().default(''),
  address: z.string().optional().default(''),
  operatingArea: z.string().optional().default(''),
  guideCardNumber: z.string().min(2),
  issueDate: z.string().optional().default(''),
  expiryDate: z.string().optional().default(''),
  issuePlace: z.string().optional().default(''),
  note: z.string().optional().default(''),
  languages: z.array(z.string()).min(1),
  active: z.boolean().optional().default(true),
});

export function createSuppliersRouter() {
  const router = Router();
  router.use(authenticate, requireRoles('coordinator', 'manager', 'admin'));

  router.get('/tour-guides/all', asyncHandler(async (_req, res) => {
    const guides = await prisma.tourGuide.findMany({
      orderBy: { code: 'asc' },
    });

    res.json({
      success: true,
      guides: guides.map(mapTourGuide),
    });
  }));

  router.post('/tour-guides', asyncHandler(async (req, res) => {
    const input = guideSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid guide payload');
    }

    const code = input.data.code || nextCode('HDV', (await prisma.tourGuide.findMany({
      select: { code: true },
      orderBy: { code: 'asc' },
    })).map((item) => item.code));

    const created = await prisma.tourGuide.create({
      data: {
        code,
        fullName: input.data.name,
        gender: input.data.gender === 'Nữ' ? Gender.FEMALE : Gender.MALE,
        dateOfBirth: new Date(input.data.dob),
        phone: input.data.phone,
        email: input.data.email || null,
        address: input.data.address || null,
        operatingArea: input.data.operatingArea || null,
        guideCardNumber: input.data.guideCardNumber,
        issueDate: input.data.issueDate ? new Date(input.data.issueDate) : null,
        expiryDate: input.data.expiryDate ? new Date(input.data.expiryDate) : null,
        issuePlace: input.data.issuePlace || null,
        note: input.data.note || null,
        languagesJson: input.data.languages,
        isActive: input.data.active,
      },
    });

    res.status(201).json({
      success: true,
      guide: mapTourGuide(created),
    });
  }));

  router.patch('/tour-guides/:id', asyncHandler(async (req, res) => {
    const input = guideSchema.partial().safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid guide payload');
    }

    const existing = await prisma.tourGuide.findFirst({
      where: { OR: [{ id: String(req.params.id) }, { code: String(req.params.id) }] },
    });

    if (!existing) {
      throw notFound('Guide not found');
    }

    const updated = await prisma.tourGuide.update({
      where: { id: existing.id },
      data: {
        fullName: input.data.name ?? existing.fullName,
        gender: input.data.gender ? (input.data.gender === 'Nữ' ? Gender.FEMALE : Gender.MALE) : existing.gender,
        dateOfBirth: input.data.dob ? new Date(input.data.dob) : existing.dateOfBirth,
        phone: input.data.phone ?? existing.phone,
        email: input.data.email === undefined ? existing.email : (input.data.email || null),
        address: input.data.address === undefined ? existing.address : (input.data.address || null),
        operatingArea: input.data.operatingArea === undefined ? existing.operatingArea : (input.data.operatingArea || null),
        guideCardNumber: input.data.guideCardNumber ?? existing.guideCardNumber,
        issueDate: input.data.issueDate === undefined ? existing.issueDate : (input.data.issueDate ? new Date(input.data.issueDate) : null),
        expiryDate: input.data.expiryDate === undefined ? existing.expiryDate : (input.data.expiryDate ? new Date(input.data.expiryDate) : null),
        issuePlace: input.data.issuePlace === undefined ? existing.issuePlace : (input.data.issuePlace || null),
        note: input.data.note === undefined ? existing.note : (input.data.note || null),
        languagesJson: (input.data.languages ?? existing.languagesJson) as Prisma.InputJsonValue,
        isActive: input.data.active ?? existing.isActive,
      },
    });

    res.json({
      success: true,
      guide: mapTourGuide(updated),
    });
  }));

  router.delete('/tour-guides/:id', asyncHandler(async (req, res) => {
    const existing = await prisma.tourGuide.findFirst({
      where: { OR: [{ id: String(req.params.id) }, { code: String(req.params.id) }] },
    });

    if (!existing) {
      throw notFound('Guide not found');
    }

    await prisma.tourGuide.delete({
      where: { id: existing.id },
    });

    res.json({ success: true });
  }));

  router.get('/', asyncHandler(async (_req, res) => {
    const suppliers = await prisma.supplier.findMany({
      include: {
        serviceVariants: {
          include: { prices: true },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      suppliers: suppliers.map(mapSupplier),
    });
  }));

  router.post('/', asyncHandler(async (req, res) => {
    const input = supplierSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid supplier payload');
    }

    const created = await prisma.supplier.create({
      data: {
        name: input.data.name,
        phone: input.data.phone,
        email: input.data.email || null,
        address: input.data.address || null,
        type: input.data.type,
        serviceSummary: input.data.serviceSummary || null,
        operatingArea: input.data.operatingArea || null,
        standardsJson: input.data.standards,
        establishedYear: input.data.establishedYear ?? null,
        description: input.data.description || null,
        isActive: input.data.isActive,
        serviceVariants: {
          create: [
            ...buildVariantCreateInput(input.data.services, false),
            ...buildVariantCreateInput(input.data.mealServices, true),
          ],
        },
      },
      include: {
        serviceVariants: {
          include: { prices: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    res.status(201).json({
      success: true,
      supplier: mapSupplier(created),
    });
  }));

  router.get('/:id', asyncHandler(async (req, res) => {
    const supplier = await prisma.supplier.findUnique({
      where: { id: String(req.params.id) },
      include: {
        serviceVariants: {
          include: { prices: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!supplier) {
      throw notFound('Supplier not found');
    }

    res.json({
      success: true,
      supplier: mapSupplier(supplier),
    });
  }));

  router.patch('/:id', asyncHandler(async (req, res) => {
    const input = supplierSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid supplier payload');
    }

    const existing = await prisma.supplier.findUnique({
      where: { id: String(req.params.id) },
    });

    if (!existing) {
      throw notFound('Supplier not found');
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.supplierServiceVariant.deleteMany({
        where: { supplierId: existing.id },
      });

      return tx.supplier.update({
        where: { id: existing.id },
        data: {
          name: input.data.name,
          phone: input.data.phone,
          email: input.data.email || null,
          address: input.data.address || null,
          type: input.data.type,
          serviceSummary: input.data.serviceSummary || null,
          operatingArea: input.data.operatingArea || null,
          standardsJson: input.data.standards,
          establishedYear: input.data.establishedYear ?? null,
          description: input.data.description || null,
          isActive: input.data.isActive,
          serviceVariants: {
            create: [
              ...buildVariantCreateInput(input.data.services, false),
              ...buildVariantCreateInput(input.data.mealServices, true),
            ],
          },
        },
        include: {
          serviceVariants: {
            include: { prices: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    });

    res.json({
      success: true,
      supplier: mapSupplier(updated),
    });
  }));

  router.delete('/:id', asyncHandler(async (req, res) => {
    const existing = await prisma.supplier.findUnique({
      where: { id: String(req.params.id) },
    });

    if (!existing) {
      throw notFound('Supplier not found');
    }

    await prisma.supplier.delete({
      where: { id: existing.id },
    });

    res.json({ success: true });
  }));

  router.post('/:id/prices', asyncHandler(async (req, res) => {
    const input = bulkPriceSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid supplier price payload');
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: String(req.params.id) },
      include: {
        serviceVariants: {
          include: { prices: true },
        },
      },
    });

    if (!supplier) {
      throw notFound('Supplier not found');
    }

    const effectiveDate = new Date(input.data.fromDate);
    const endDate = toRequiredDate(input.data.toDate);
    await prisma.$transaction(async (tx) => {
      for (const variant of supplier.serviceVariants) {
        const nextPrice = input.data.priceMap[variant.id];
        if (!nextPrice || nextPrice <= 0) continue;

        await reconcileSupplierPriceRanges(tx, variant.prices, variant.id, effectiveDate, endDate);

        await tx.supplierServicePrice.create({
          data: {
            serviceVariantId: variant.id,
            unitPrice: nextPrice,
            fromDate: effectiveDate,
            toDate: endDate,
            note: input.data.note,
            createdByName: input.data.createdBy,
          },
        });
      }
    });

    const updated = await prisma.supplier.findUnique({
      where: { id: supplier.id },
      include: {
        serviceVariants: {
          include: { prices: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    res.json({
      success: true,
      supplier: updated ? mapSupplier(updated) : null,
    });
  }));

  router.post('/:id/service-variants/:serviceId/prices', asyncHandler(async (req, res) => {
    const input = supplierPriceSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid supplier price payload');
    }

    const variant = await prisma.supplierServiceVariant.findFirst({
      where: {
        id: String(req.params.serviceId),
        supplierId: String(req.params.id),
      },
      include: { prices: true },
    });

    if (!variant) {
      throw notFound('Supplier service not found');
    }

    const fromDate = new Date(input.data.fromDate);
    const toDate = toRequiredDate(input.data.toDate);
    const price = await prisma.$transaction(async (tx) => {
      await reconcileSupplierPriceRanges(tx, variant.prices ?? [], variant.id, fromDate, toDate);
      return tx.supplierServicePrice.create({
        data: {
          serviceVariantId: variant.id,
          unitPrice: input.data.unitPrice,
          fromDate,
          toDate,
          note: input.data.note,
          createdByName: input.data.createdBy,
        },
      });
    });

    res.status(201).json({
      success: true,
      price: {
        id: price.id,
        fromDate: price.fromDate.toISOString().slice(0, 10),
        toDate: price.toDate.getUTCFullYear() >= 9999 ? '' : price.toDate.toISOString().slice(0, 10),
        unitPrice: Number(price.unitPrice),
        note: price.note ?? '',
        createdBy: price.createdByName,
      },
    });
  }));

  router.patch('/:id/service-variants/:serviceId/prices/:priceId', asyncHandler(async (req, res) => {
    const input = supplierPriceSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid supplier price payload');
    }

    const variant = await prisma.supplierServiceVariant.findFirst({
      where: {
        id: String(req.params.serviceId),
        supplierId: String(req.params.id),
      },
      include: { prices: true },
    });

    if (!variant) {
      throw notFound('Supplier service not found');
    }

    const existingPrice = variant.prices.find((price) => price.id === String(req.params.priceId));
    if (!existingPrice) {
      throw notFound('Supplier price not found');
    }

    const price = await prisma.supplierServicePrice.update({
      where: { id: existingPrice.id },
      data: {
        unitPrice: input.data.unitPrice,
        fromDate: new Date(input.data.fromDate),
        toDate: toRequiredDate(input.data.toDate),
        note: input.data.note,
        createdByName: input.data.createdBy,
      },
    });

    res.json({
      success: true,
      price: {
        id: price.id,
        fromDate: price.fromDate.toISOString().slice(0, 10),
        toDate: price.toDate.getUTCFullYear() >= 9999 ? '' : price.toDate.toISOString().slice(0, 10),
        unitPrice: Number(price.unitPrice),
        note: price.note ?? '',
        createdBy: price.createdByName,
      },
    });
  }));

  return router;
}

type SupplierPriceRecord = {
  id: string;
  unitPrice: Prisma.Decimal | number;
  note: string | null;
  fromDate: Date;
  toDate: Date;
  createdByName: string;
};

function addUtcDays(date: Date, days: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
}

function dateTime(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function rangesOverlap(oldStart: Date, oldEnd: Date, newStart: Date, newEnd: Date) {
  return dateTime(oldStart) <= dateTime(newEnd) && dateTime(oldEnd) >= dateTime(newStart);
}

async function reconcileSupplierPriceRanges(
  tx: Prisma.TransactionClient,
  prices: SupplierPriceRecord[],
  serviceVariantId: string,
  newStart: Date,
  newEnd: Date,
) {
  const beforeNewStart = addUtcDays(newStart, -1);
  const afterNewEnd = addUtcDays(newEnd, 1);

  for (const price of prices) {
    const oldStart = price.fromDate;
    const oldEnd = price.toDate;
    if (!rangesOverlap(oldStart, oldEnd, newStart, newEnd)) continue;

    if (dateTime(oldStart) >= dateTime(newStart) && dateTime(oldEnd) <= dateTime(newEnd)) {
      await tx.supplierServicePrice.deleteMany({ where: { id: price.id } });
      continue;
    }

    if (dateTime(oldStart) < dateTime(newStart) && dateTime(oldEnd) >= dateTime(newStart) && dateTime(oldEnd) <= dateTime(newEnd)) {
      await tx.supplierServicePrice.updateMany({
        where: { id: price.id },
        data: { toDate: beforeNewStart },
      });
      continue;
    }

    if (dateTime(oldStart) >= dateTime(newStart) && dateTime(oldStart) <= dateTime(newEnd) && dateTime(oldEnd) > dateTime(newEnd)) {
      await tx.supplierServicePrice.updateMany({
        where: { id: price.id },
        data: { fromDate: afterNewEnd },
      });
      continue;
    }

    if (dateTime(oldStart) < dateTime(newStart) && dateTime(oldEnd) > dateTime(newEnd)) {
      await tx.supplierServicePrice.updateMany({
        where: { id: price.id },
        data: { toDate: beforeNewStart },
      });
      await tx.supplierServicePrice.create({
        data: {
          serviceVariantId,
          unitPrice: price.unitPrice,
          fromDate: afterNewEnd,
          toDate: oldEnd,
          note: price.note,
          createdByName: price.createdByName,
        },
      });
    }
  }
}

function buildVariantCreateInput(
  rows: Array<z.infer<typeof serviceVariantSchema>>,
  isMealService: boolean,
) {
  return rows.map((row) => ({
    name: row.name,
    unit: row.unit,
    description: row.description || null,
    basePrice: row.prices.at(-1)?.unitPrice ?? 0,
    quantity: row.quantity ?? null,
    capacity: row.capacity ?? null,
    transportType: row.transportType ?? null,
    priceMode: row.priceMode ?? null,
    menu: row.menu || null,
    note: row.note || null,
    isMealService,
    prices: row.prices.length > 0
      ? {
          create: row.prices.map((price) => ({
            unitPrice: price.unitPrice,
            fromDate: new Date(price.fromDate),
            toDate: toRequiredDate(price.toDate),
            note: price.note,
            createdByName: price.createdBy,
          })),
        }
      : undefined,
  }));
}
