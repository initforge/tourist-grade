import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  user: {
    findUnique: vi.fn(),
  },
  service: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  servicePrice: {
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

const { createServicesRouter } = await import('./services.js');

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/', createServicesRouter());
  app.use((error: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(error.status ?? 500).json({
      success: false,
      message: error.message,
    });
  });
  return app;
}

function createServiceFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'service-db-1',
    code: 'SV001',
    name: 'Ve Ba Na',
    category: 'ATTRACTION_TICKET',
    unit: 've',
    priceMode: 'LISTED',
    priceSetup: 'BY_AGE',
    status: 'ACTIVE',
    description: 'Mo ta',
    supplierName: 'Sun Group',
    contactInfo: '0909',
    province: 'Da Nang',
    formulaCount: 'DEFAULT_VALUE',
    formulaCountDefault: '1',
    formulaQuantity: 'MANUAL',
    formulaQuantityDefault: '',
    prices: [
      {
        id: 'PRICE-1',
        unitPrice: 350000,
        note: 'Nguoi lon',
        effectiveDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: new Date('9999-12-31T00:00:00.000Z'),
        createdByName: 'Seeder',
      },
    ],
    createdAt: new Date('2026-04-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('services routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.user.findUnique.mockResolvedValue({ id: 'coordinator-1', status: 'ACTIVE' });
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof prismaMock) => Promise<unknown>) => callback(prismaMock as never));
  });

  it('creates a service with initial price rows and preserves age pricing setup', async () => {
    prismaMock.service.create.mockResolvedValue(createServiceFixture());

    const response = await request(createTestApp())
      .post('/')
      .set('Authorization', 'Bearer token')
      .send({
        code: 'SV001',
        name: 'Ve Ba Na',
        category: 'ATTRACTION_TICKET',
        unit: 've',
        priceMode: 'LISTED',
        priceSetup: 'BY_AGE',
        status: 'ACTIVE',
        description: 'Mo ta',
        supplierName: 'Sun Group',
        contactInfo: '0909',
        province: 'Da Nang',
        formulaCount: 'DEFAULT_VALUE',
        formulaCountDefault: '1',
        formulaQuantity: 'MANUAL',
        prices: [
          {
            unitPrice: 350000,
            note: 'Nguoi lon',
            effectiveDate: '2026-01-01',
            endDate: '',
            createdBy: 'Coordinator',
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(prismaMock.service.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        code: 'SV001',
        priceSetup: 'BY_AGE',
        prices: {
          create: [
            expect.objectContaining({
              unitPrice: 350000,
              createdByName: 'Coordinator',
            }),
          ],
        },
      }),
    }));
    expect(response.body.service.setup).toBe('Theo độ tuổi');
  });

  it('closes the open-ended system price before adding a new price row', async () => {
    prismaMock.service.findFirst.mockResolvedValue(createServiceFixture());
    prismaMock.servicePrice.create.mockResolvedValue({
      id: 'PRICE-2',
      unitPrice: 390000,
      note: 'Nguoi lon',
      effectiveDate: new Date('2026-06-01T00:00:00.000Z'),
      endDate: new Date('9999-12-31T00:00:00.000Z'),
      createdByName: 'Coordinator',
    });

    const response = await request(createTestApp())
      .post('/SV001/prices')
      .set('Authorization', 'Bearer token')
      .send({
        unitPrice: 390000,
        note: 'Nguoi lon',
        effectiveDate: '2026-06-01',
        endDate: '',
        createdBy: 'Coordinator',
      });

    expect(response.status).toBe(201);
    expect(prismaMock.servicePrice.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: 'PRICE-1',
      }),
      data: {
        endDate: new Date('2026-05-31T00:00:00.000Z'),
      },
    }));
    expect(prismaMock.servicePrice.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        serviceId: 'service-db-1',
        unitPrice: 390000,
      }),
    }));
    expect(response.body.price.endDate).toBe('');
  });

  it('only reconciles service price rows with the same age note', async () => {
    prismaMock.service.findFirst.mockResolvedValue(createServiceFixture({
      prices: [
        {
          id: 'PRICE-ADULT',
          unitPrice: 350000,
          note: 'Nguoi lon',
          effectiveDate: new Date('2026-01-01T00:00:00.000Z'),
          endDate: new Date('9999-12-31T00:00:00.000Z'),
          createdByName: 'Seeder',
        },
        {
          id: 'PRICE-CHILD',
          unitPrice: 250000,
          note: 'Tre em',
          effectiveDate: new Date('2026-01-01T00:00:00.000Z'),
          endDate: new Date('9999-12-31T00:00:00.000Z'),
          createdByName: 'Seeder',
        },
      ],
    }));
    prismaMock.servicePrice.create.mockResolvedValue({
      id: 'PRICE-NEW',
      unitPrice: 390000,
      note: 'Nguoi lon',
      effectiveDate: new Date('2026-06-01T00:00:00.000Z'),
      endDate: new Date('9999-12-31T00:00:00.000Z'),
      createdByName: 'Coordinator',
    });

    const response = await request(createTestApp())
      .post('/SV001/prices')
      .set('Authorization', 'Bearer token')
      .send({
        unitPrice: 390000,
        note: 'Nguoi lon',
        effectiveDate: '2026-06-01',
        endDate: '',
        createdBy: 'Coordinator',
      });

    expect(response.status).toBe(201);
    expect(prismaMock.servicePrice.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'PRICE-ADULT' },
      data: { endDate: new Date('2026-05-31T00:00:00.000Z') },
    }));
    expect(prismaMock.servicePrice.updateMany).not.toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'PRICE-CHILD' },
    }));
  });

  it('reconciles related ranges when editing an existing service price row', async () => {
    prismaMock.service.findFirst.mockResolvedValue(createServiceFixture({
      prices: [
        {
          id: 'PRICE-1',
          unitPrice: 350000,
          note: 'Nguoi lon',
          effectiveDate: new Date('2026-01-01T00:00:00.000Z'),
          endDate: new Date('2026-05-31T00:00:00.000Z'),
          createdByName: 'Seeder',
        },
        {
          id: 'PRICE-2',
          unitPrice: 390000,
          note: 'Nguoi lon',
          effectiveDate: new Date('2026-06-01T00:00:00.000Z'),
          endDate: new Date('9999-12-31T00:00:00.000Z'),
          createdByName: 'Coordinator',
        },
      ],
    }));
    prismaMock.servicePrice.create.mockResolvedValue({
      id: 'PRICE-2',
      unitPrice: 410000,
      note: 'Nguoi lon',
      effectiveDate: new Date('2026-07-01T00:00:00.000Z'),
      endDate: new Date('9999-12-31T00:00:00.000Z'),
      createdByName: 'Coordinator',
    });

    const response = await request(createTestApp())
      .patch('/SV001/prices/PRICE-2')
      .set('Authorization', 'Bearer token')
      .send({
        unitPrice: 410000,
        note: 'Nguoi lon',
        effectiveDate: '2026-07-01',
        endDate: '',
        createdBy: 'Coordinator',
      });

    expect(response.status).toBe(200);
    expect(prismaMock.servicePrice.delete).toHaveBeenCalledWith({ where: { id: 'PRICE-2' } });
    expect(prismaMock.servicePrice.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'PRICE-1' },
      data: { endDate: new Date('2026-06-30T00:00:00.000Z') },
    }));
    expect(prismaMock.servicePrice.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        id: 'PRICE-2',
        serviceId: 'service-db-1',
        unitPrice: 410000,
      }),
    }));
  });
});
