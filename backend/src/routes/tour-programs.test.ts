import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  $transaction: vi.fn(async (callback: (tx: typeof prismaMock) => unknown) => callback(prismaMock)),
  user: {
    findUnique: vi.fn(),
  },
  tourProgram: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  tourInstance: {
    createMany: vi.fn(),
  },
};

vi.mock('../lib/prisma.js', () => ({
  prisma: prismaMock,
}));

vi.mock('../lib/jwt.js', () => ({
  verifyAccessToken: (token: string) => ({
    sub: token === 'manager-token' ? 'manager-1' : 'coordinator-1',
    role: token === 'manager-token' ? 'manager' : 'coordinator',
    email: 'test@travela.vn',
  }),
}));

const { createTourProgramsRouter } = await import('./tour-programs.js');

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/', createTourProgramsRouter());
  app.use((error: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(error.status ?? 500).json({
      success: false,
      message: error.message,
    });
  });
  return app;
}

function createProgramFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'program-db-1',
    code: 'TP001',
    slug: 'tour-da-nang-tp001',
    name: 'Tour Da Nang',
    description: 'Mo ta',
    departurePoint: 'Ha Noi',
    arrivalPoint: null,
    sightseeingSpots: ['Da Nang'],
    durationDays: 3,
    durationNights: 2,
    transport: 'XE',
    tourType: 'QUANH_NAM',
    holidayLabel: null,
    bookingDeadline: 7,
    status: 'DRAFT',
    itineraryJson: [
      { day: 1, title: 'Ngay 1', description: 'Mo ta', meals: ['lunch'] },
    ],
    pricingConfigJson: {
      pricingConfig: {
        profitMargin: 15,
        taxRate: 10,
        otherCostFactor: 0.15,
        netPrice: 2500000,
        sellPriceAdult: 3100000,
        sellPriceChild: 2300000,
        sellPriceInfant: 0,
        minParticipants: 10,
        guideUnitPrice: 500000,
      },
      draftPricingTables: {},
      draftManualPricing: {},
      draftPricingOverrides: {},
    },
    publicContentJson: {
      selectedDates: [],
      weekdays: ['t2'],
      yearRoundStartDate: '2026-08-01',
      yearRoundEndDate: '2026-12-31',
      coverageMonths: 3,
      approvalStatus: 'pending',
      lodgingStandard: '4 sao',
      priceIncludes: 'Ve tham quan\nBua an',
      priceExcludes: 'Chi phi ca nhan',
      draftPreviewRows: [],
    },
    createdById: 'coordinator-1',
    updatedById: 'coordinator-1',
    createdAt: new Date('2026-04-01T00:00:00.000Z'),
    updatedAt: new Date('2026-04-02T00:00:00.000Z'),
    ...overrides,
  };
}

function createPayload() {
  return {
    name: 'Tour Da Nang',
    departurePoint: 'Ha Noi',
    sightseeingSpots: ['Da Nang'],
    duration: { days: 3, nights: 2 },
    lodgingStandard: '4 sao',
    transport: 'xe',
    tourType: 'quanh_nam',
    routeDescription: 'Mo ta',
    priceIncludes: 'Ve tham quan\nBua an',
    priceExcludes: 'Chi phi ca nhan',
    weekdays: ['t2'],
    yearRoundStartDate: '2026-08-01',
    yearRoundEndDate: '2026-12-31',
    coverageMonths: 3,
    bookingDeadline: 7,
    status: 'draft',
    itinerary: [{ day: 1, title: 'Ngay 1', description: 'Mo ta', meals: ['lunch'] }],
    pricingConfig: {
      profitMargin: 15,
      taxRate: 10,
      otherCostFactor: 0.15,
      netPrice: 2500000,
      sellPriceAdult: 3100000,
      sellPriceChild: 2300000,
      sellPriceInfant: 0,
      minParticipants: 10,
      guideUnitPrice: 500000,
    },
    draftPricingTables: {},
    draftManualPricing: {},
    draftPricingOverrides: {},
    draftPreviewRows: [],
  };
}

describe('tour-program routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.user.findUnique.mockResolvedValue({ id: 'coordinator-1', status: 'ACTIVE' });
  });

  it('creates a coordinator tour program with generated code and wrapped coordinator fields', async () => {
    prismaMock.tourProgram.findMany.mockResolvedValue([{ code: 'TP001' }, { code: 'TP004' }]);
    prismaMock.tourProgram.create.mockResolvedValue(createProgramFixture({ code: 'TP005' }));

    const response = await request(createTestApp())
      .post('/')
      .set('Authorization', 'Bearer coordinator-token')
      .send(createPayload());

    expect(response.status).toBe(201);
    expect(prismaMock.tourProgram.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        code: 'TP005',
        transport: 'XE',
        tourType: 'QUANH_NAM',
        publicContentJson: expect.objectContaining({
          lodgingStandard: '4 sao',
          coverageMonths: 3,
          priceIncludes: 'Ve tham quan\nBua an',
          priceExcludes: 'Chi phi ca nhan',
        }),
        pricingConfigJson: expect.objectContaining({
          pricingConfig: expect.objectContaining({
            guideUnitPrice: 500000,
          }),
        }),
      }),
    }));
    expect(response.body.tourProgram.id).toBe('TP005');
  });

  it('submits a program for approval and clears the previous rejection state', async () => {
    prismaMock.tourProgram.findFirst.mockResolvedValue(createProgramFixture({
      publicContentJson: {
        approvalStatus: 'rejected',
        rejectionReason: 'Missing pricing',
      },
    }));
    prismaMock.tourProgram.update.mockResolvedValue(createProgramFixture({
      publicContentJson: {
        approvalStatus: 'pending',
        rejectionReason: null,
        submittedAt: '2026-04-27T00:00:00.000Z',
      },
    }));

    const response = await request(createTestApp())
      .post('/TP001/submit')
      .set('Authorization', 'Bearer coordinator-token')
      .send({});

    expect(response.status).toBe(200);
    expect(prismaMock.tourProgram.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: 'DRAFT',
        publicContentJson: expect.objectContaining({
          approvalStatus: 'pending',
          rejectionReason: null,
        }),
      }),
    }));
    expect(response.body.tourProgram.approvalStatus).toBe('pending');
  });

  it('stores rejection reason when manager rejects a tour program', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'manager-1', status: 'ACTIVE' });
    prismaMock.tourProgram.findFirst.mockResolvedValue(createProgramFixture({ status: 'ACTIVE' }));
    prismaMock.tourProgram.update.mockResolvedValue(createProgramFixture({
      publicContentJson: {
        approvalStatus: 'rejected',
        rejectionReason: 'Need revise planned tours',
      },
    }));

    const response = await request(createTestApp())
      .post('/TP001/reject')
      .set('Authorization', 'Bearer manager-token')
      .send({ reason: 'Need revise planned tours' });

    expect(response.status).toBe(200);
    expect(prismaMock.tourProgram.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: 'DRAFT',
        publicContentJson: expect.objectContaining({
          approvalStatus: 'rejected',
          rejectionReason: 'Need revise planned tours',
        }),
      }),
    }));
    expect(response.body.tourProgram.rejectionReason).toBe('Need revise planned tours');
  });

  it('approves a program and creates unchecked preview rows as rejected sale tours', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'manager-1', status: 'ACTIVE' });
    prismaMock.tourProgram.findFirst.mockResolvedValue(createProgramFixture({
      publicContentJson: {
        approvalStatus: 'pending',
        draftPreviewRows: [
          {
            id: 'T001',
            departureDate: '2026-08-01',
            endDate: '2026-08-03',
            dayType: 'Ngay thuong',
            expectedGuests: 10,
            costPerAdult: 2500000,
            sellPrice: 3100000,
            profitPercent: 20,
            bookingDeadline: '2026-07-25',
            conflictLabel: '',
            conflictDetails: [],
            checked: true,
          },
          {
            id: 'T002',
            departureDate: '2026-08-08',
            endDate: '2026-08-10',
            dayType: 'Ngay thuong',
            expectedGuests: 10,
            costPerAdult: 2500000,
            sellPrice: 3100000,
            profitPercent: 20,
            bookingDeadline: '2026-08-01',
            conflictLabel: '',
            conflictDetails: [],
            checked: false,
          },
        ],
      },
    }));
    prismaMock.tourProgram.update.mockResolvedValue(createProgramFixture({
      status: 'ACTIVE',
      publicContentJson: { approvalStatus: 'approved' },
    }));
    prismaMock.tourInstance.createMany.mockResolvedValue({ count: 2 });

    const response = await request(createTestApp())
      .post('/TP001/approve')
      .set('Authorization', 'Bearer manager-token')
      .send({});

    expect(response.status).toBe(200);
    expect(prismaMock.tourInstance.createMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.arrayContaining([
        expect.objectContaining({ code: 'REQ-TP001-2026-08-01', status: 'CHO_DUYET_BAN' }),
        expect.objectContaining({ code: 'REQ-TP001-2026-08-08', status: 'TU_CHOI_BAN' }),
      ]),
      skipDuplicates: true,
    }));
  });
});
