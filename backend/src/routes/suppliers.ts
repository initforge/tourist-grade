import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, badRequest, notFound } from '../lib/http.js';
import { mapSupplier } from '../lib/mappers.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const priceSchema = z.object({
  fromDate: z.string(),
  toDate: z.string(),
  unitPrice: z.number().positive(),
  note: z.string().optional().default(''),
  createdBy: z.string().min(2),
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
      guides,
    });
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

  router.get('/:id', asyncHandler(async (req, res) => {
    const supplierId = String(req.params.id);
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
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

  router.post('/:id/service-variants/:serviceId/prices', asyncHandler(async (req, res) => {
    const supplierId = String(req.params.id);
    const serviceId = String(req.params.serviceId);
    const input = priceSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid supplier price payload');
    }

    const variant = await prisma.supplierServiceVariant.findFirst({
      where: {
        id: serviceId,
        supplierId,
      },
    });

    if (!variant) {
      throw notFound('Supplier service not found');
    }

    const price = await prisma.supplierServicePrice.create({
      data: {
        serviceVariantId: variant.id,
        unitPrice: input.data.unitPrice,
        fromDate: new Date(input.data.fromDate),
        toDate: new Date(input.data.toDate),
        note: input.data.note,
        createdByName: input.data.createdBy,
      },
    });

    res.status(201).json({
      success: true,
      price: {
        id: price.id,
        fromDate: price.fromDate.toISOString().slice(0, 10),
        toDate: price.toDate.toISOString().slice(0, 10),
        unitPrice: Number(price.unitPrice),
        note: price.note ?? '',
        createdBy: price.createdByName,
      },
    });
  }));

  return router;
}
