import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  user: {
    findUnique: vi.fn(),
  },
  tourGuide: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  supplier: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  supplierServiceVariant: {
    findFirst: vi.fn(),
    deleteMany: vi.fn(),
  },
  supplierServicePrice: {
    delete: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn(),
};

vi.mock('../lib/prisma.js', () => ({
  prisma: prismaMock,
}));

vi.mock('../lib/jwt.js', () => ({
  verifyAccessToken: () => ({
    sub: 'coordinator-1',
    role: 'coordinator',
    email: 'coordinator@travela.vn',
  }),
}));

const { createSuppliersRouter } = await import('./suppliers.js');

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/', createSuppliersRouter());
  app.use((error: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(error.status ?? 500).json({
      success: false,
      message: error.message,
    });
  });
  return app;
}

function createGuideFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'guide-db-1',
    code: 'HDV001',
    fullName: 'Guide 1',
    gender: 'MALE',
    dateOfBirth: new Date('1990-01-01T00:00:00.000Z'),
    phone: '0909',
    email: 'guide@test.vn',
    address: 'Ha Noi',
    operatingArea: 'Da Nang',
    guideCardNumber: 'CARD-001',
    issueDate: new Date('2025-01-01T00:00:00.000Z'),
    expiryDate: new Date('2027-01-01T00:00:00.000Z'),
    issuePlace: 'So Du Lich',
    note: '',
    languagesJson: ['Tieng Anh'],
    isActive: true,
    ...overrides,
  };
}

function createSupplierFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'SUP001',
    name: 'Van tai Viet Tourist',
    phone: '0909',
    email: 'ops@test.vn',
    address: 'Da Nang',
    type: 'TRANSPORT',
    serviceSummary: 'Xe tham quan',
    operatingArea: 'Da Nang',
    establishedYear: 2020,
    description: 'Mo ta',
    isActive: true,
    serviceVariants: [
      {
        id: 'variant-1',
        name: 'Xe 29 cho',
        unit: 'xe',
        description: '',
        quantity: 1,
        capacity: 29,
        transportType: 'XE',
        priceMode: 'QUOTED',
        menu: null,
        note: null,
        isMealService: false,
        prices: [
          {
            id: 'variant-1-price-1',
            fromDate: new Date('2026-01-01T00:00:00.000Z'),
            toDate: new Date('9999-12-31T00:00:00.000Z'),
            unitPrice: 8100000,
            note: 'Khoi tao',
            createdByName: 'Seeder',
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe('suppliers routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.user.findUnique.mockResolvedValue({ id: 'coordinator-1', status: 'ACTIVE' });
  });

  it('creates a tour guide with persisted languages and identity fields', async () => {
    prismaMock.tourGuide.findMany.mockResolvedValue([{ code: 'HDV001' }]);
    prismaMock.tourGuide.create.mockResolvedValue(createGuideFixture({ code: 'HDV002' }));

    const response = await request(createTestApp())
      .post('/tour-guides')
      .set('Authorization', 'Bearer token')
      .send({
        name: 'Guide 1',
        gender: 'Nam',
        dob: '1990-01-01',
        phone: '0909',
        email: 'guide@test.vn',
        address: 'Ha Noi',
        operatingArea: 'Da Nang',
        guideCardNumber: 'CARD-001',
        issueDate: '2025-01-01',
        expiryDate: '2027-01-01',
        issuePlace: 'So Du Lich',
        note: '',
        languages: ['Tieng Anh'],
      });

    expect(response.status).toBe(201);
    expect(prismaMock.tourGuide.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        code: 'HDV002',
        guideCardNumber: 'CARD-001',
        languagesJson: ['Tieng Anh'],
      }),
    }));
    expect(response.body.guide.id).toBe('HDV002');
  });

  it('applies supplier bulk price updates by closing open-ended prices first', async () => {
    prismaMock.supplier.findUnique
      .mockResolvedValueOnce(createSupplierFixture())
      .mockResolvedValueOnce(createSupplierFixture());
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof prismaMock) => Promise<unknown>) => callback(prismaMock as never));

    const response = await request(createTestApp())
      .post('/SUP001/prices')
      .set('Authorization', 'Bearer token')
      .send({
        fromDate: '2026-06-01',
        toDate: '',
        note: 'Cap nhat tu du toan',
        createdBy: 'Coordinator',
        priceMap: { 'variant-1': 9000000 },
      });

    expect(response.status).toBe(200);
    expect(prismaMock.supplierServicePrice.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: 'variant-1-price-1',
      }),
      data: {
        toDate: new Date('2026-05-31T00:00:00.000Z'),
      },
    }));
    expect(prismaMock.supplierServicePrice.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        serviceVariantId: 'variant-1',
        unitPrice: 9000000,
      }),
    }));
    expect(response.body.supplier.id).toBe('SUP001');
  });

  it('adds a new price row for one supplier service variant', async () => {
    prismaMock.supplierServiceVariant.findFirst.mockResolvedValue({
      id: 'variant-1',
      supplierId: 'SUP001',
      prices: [
        {
          id: 'variant-1-price-1',
          fromDate: new Date('2026-01-01T00:00:00.000Z'),
          toDate: new Date('9999-12-31T00:00:00.000Z'),
          unitPrice: 8100000,
          note: 'Khoi tao',
          createdByName: 'Seeder',
        },
      ],
    });
    prismaMock.supplierServicePrice.create.mockResolvedValue({
      id: 'price-2',
      fromDate: new Date('2026-07-01T00:00:00.000Z'),
      toDate: new Date('9999-12-31T00:00:00.000Z'),
      unitPrice: 9200000,
      note: 'Gia moi',
      createdByName: 'Coordinator',
    });

    const response = await request(createTestApp())
      .post('/SUP001/service-variants/variant-1/prices')
      .set('Authorization', 'Bearer token')
      .send({
        fromDate: '2026-07-01',
        toDate: '',
        unitPrice: 9200000,
        note: 'Gia moi',
        createdBy: 'Coordinator',
      });

    expect(response.status).toBe(201);
    expect(prismaMock.supplierServicePrice.updateMany).toHaveBeenCalled();
    expect(prismaMock.supplierServicePrice.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        serviceVariantId: 'variant-1',
        unitPrice: 9200000,
      }),
    }));
    expect(response.body.price.toDate).toBe('');
  });

  it('reconciles related ranges when editing a supplier service variant price row', async () => {
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof prismaMock) => Promise<unknown>) => callback(prismaMock as never));
    prismaMock.supplierServiceVariant.findFirst.mockResolvedValue({
      id: 'variant-1',
      supplierId: 'SUP001',
      prices: [
        {
          id: 'variant-1-price-1',
          fromDate: new Date('2026-01-01T00:00:00.000Z'),
          toDate: new Date('2026-05-31T00:00:00.000Z'),
          unitPrice: 8100000,
          note: 'Khoi tao',
          createdByName: 'Seeder',
        },
        {
          id: 'variant-1-price-2',
          fromDate: new Date('2026-06-01T00:00:00.000Z'),
          toDate: new Date('9999-12-31T00:00:00.000Z'),
          unitPrice: 9000000,
          note: 'Gia moi',
          createdByName: 'Coordinator',
        },
      ],
    });
    prismaMock.supplierServicePrice.create.mockResolvedValue({
      id: 'variant-1-price-2',
      fromDate: new Date('2026-07-01T00:00:00.000Z'),
      toDate: new Date('9999-12-31T00:00:00.000Z'),
      unitPrice: 9300000,
      note: 'Sua gia',
      createdByName: 'Coordinator',
    });

    const response = await request(createTestApp())
      .patch('/SUP001/service-variants/variant-1/prices/variant-1-price-2')
      .set('Authorization', 'Bearer token')
      .send({
        fromDate: '2026-07-01',
        toDate: '',
        unitPrice: 9300000,
        note: 'Sua gia',
        createdBy: 'Coordinator',
      });

    expect(response.status).toBe(200);
    expect(prismaMock.supplierServicePrice.delete).toHaveBeenCalledWith({ where: { id: 'variant-1-price-2' } });
    expect(prismaMock.supplierServicePrice.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'variant-1-price-1' },
      data: { toDate: new Date('2026-06-30T00:00:00.000Z') },
    }));
    expect(prismaMock.supplierServicePrice.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        id: 'variant-1-price-2',
        serviceVariantId: 'variant-1',
        unitPrice: 9300000,
      }),
    }));
  });
});
