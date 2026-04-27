import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  user: {
    findUnique: vi.fn(),
  },
  tourProgram: {
    findFirst: vi.fn(),
  },
  tourInstance: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
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

const { createTourInstancesRouter } = await import('./tour-instances.js');

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/', createTourInstancesRouter());
  app.use((error: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(error.status ?? 500).json({
      success: false,
      message: error.message,
    });
  });
  return app;
}

function createInstanceFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'instance-db-1',
    code: 'REQ-TP001-2026-08-01',
    programId: 'program-db-1',
    programNameSnapshot: 'Tour Da Nang',
    departureDate: new Date('2026-08-01T00:00:00.000Z'),
    status: 'CHO_DUYET_BAN',
    departurePoint: 'Ha Noi',
    arrivalPoint: null,
    sightseeingSpots: ['Da Nang'],
    transport: 'XE',
    expectedGuests: 20,
    minParticipants: 10,
    priceAdult: 3100000,
    priceChild: 2300000,
    priceInfant: 0,
    bookingDeadlineAt: new Date('2026-07-25T00:00:00.000Z'),
    costEstimateJson: null,
    settlementJson: null,
    assignedCoordinatorId: null,
    createdById: 'coordinator-1',
    createdAt: new Date('2026-04-01T00:00:00.000Z'),
    submittedAt: new Date('2026-04-01T00:00:00.000Z'),
    approvedAt: null,
    approvedById: null,
    openedAt: null,
    closedAt: null,
    receivedAt: null,
    estimatedAt: null,
    estimateApprovedAt: null,
    readyAt: null,
    startedAt: null,
    endedAt: null,
    settledAt: null,
    cancelledAt: null,
    cancelReason: null,
    refundTotal: null,
    warningDate: null,
    program: {
      id: 'program-db-1',
      code: 'TP001',
      name: 'Tour Da Nang',
    },
    ...overrides,
  };
}

describe('tour-instance routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.user.findUnique.mockResolvedValue({ id: 'coordinator-1', status: 'ACTIVE' });
  });

  it('creates a persisted sale request from coordinator tour rules', async () => {
    prismaMock.tourProgram.findFirst.mockResolvedValue({ id: 'program-db-1', code: 'TP001', name: 'Tour Da Nang' });
    prismaMock.tourInstance.create.mockResolvedValue(createInstanceFixture());

    const response = await request(createTestApp())
      .post('/')
      .set('Authorization', 'Bearer token')
      .send({
        programId: 'TP001',
        programName: 'Tour Da Nang',
        departureDate: '2026-08-01',
        status: 'cho_duyet_ban',
        departurePoint: 'Ha Noi',
        sightseeingSpots: ['Da Nang'],
        transport: 'xe',
        expectedGuests: 20,
        priceAdult: 3100000,
        priceChild: 2300000,
        priceInfant: 0,
        minParticipants: 10,
        bookingDeadline: '2026-07-25',
      });

    expect(response.status).toBe(201);
    expect(prismaMock.tourInstance.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        code: 'REQ-TP001-2026-08-01',
        programNameSnapshot: 'Tour Da Nang',
        transport: 'XE',
        status: 'CHO_DUYET_BAN',
      }),
    }));
    expect(response.body.tourInstance.id).toBe('REQ-TP001-2026-08-01');
  });

  it('wraps estimate payload and assigned guide together when assigning guide', async () => {
    prismaMock.tourInstance.findFirst.mockResolvedValue(createInstanceFixture({
      costEstimateJson: {
        estimate: { totalCost: 18000000 },
      },
    }));
    prismaMock.tourInstance.update.mockResolvedValue(createInstanceFixture({
      costEstimateJson: {
        estimate: { totalCost: 18000000 },
        assignedGuide: { id: 'HDV001', name: 'Guide 1' },
      },
    }));

    const response = await request(createTestApp())
      .post('/REQ-TP001-2026-08-01/assign-guide')
      .set('Authorization', 'Bearer token')
      .send({ assignedGuide: { id: 'HDV001', name: 'Guide 1' } });

    expect(response.status).toBe(200);
    expect(prismaMock.tourInstance.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        costEstimateJson: {
          estimate: { totalCost: 18000000 },
          assignedGuide: { id: 'HDV001', name: 'Guide 1' },
        },
      }),
    }));
    expect(response.body.tourInstance.assignedGuide.name).toBe('Guide 1');
  });

  it('marks submitted estimate as waiting for approval', async () => {
    prismaMock.tourInstance.findFirst.mockResolvedValue(createInstanceFixture());
    prismaMock.tourInstance.update.mockResolvedValue(createInstanceFixture({
      status: 'CHO_DUYET_DU_TOAN',
      costEstimateJson: {
        estimate: { totalCost: 19000000 },
      },
    }));

    const response = await request(createTestApp())
      .post('/REQ-TP001-2026-08-01/estimate')
      .set('Authorization', 'Bearer token')
      .send({
        costEstimate: { totalCost: 19000000 },
        submit: true,
      });

    expect(response.status).toBe(200);
    expect(prismaMock.tourInstance.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: 'CHO_DUYET_DU_TOAN',
        costEstimateJson: {
          estimate: { totalCost: 19000000 },
          assignedGuide: null,
        },
      }),
    }));
    expect(response.body.tourInstance.status).toBe('cho_duyet_du_toan');
  });

  it('completes settlement and moves tour to hoan_thanh', async () => {
    prismaMock.tourInstance.findFirst.mockResolvedValue(createInstanceFixture({ status: 'CHO_QUYET_TOAN' }));
    prismaMock.tourInstance.update.mockResolvedValue(createInstanceFixture({
      status: 'HOAN_THANH',
      settlementJson: { totalActualCost: 17500000 },
      settledAt: new Date('2026-08-10T00:00:00.000Z'),
    }));

    const response = await request(createTestApp())
      .post('/REQ-TP001-2026-08-01/settlement')
      .set('Authorization', 'Bearer token')
      .send({
        settlement: { totalActualCost: 17500000 },
        complete: true,
      });

    expect(response.status).toBe(200);
    expect(prismaMock.tourInstance.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: 'HOAN_THANH',
        settlementJson: { totalActualCost: 17500000 },
      }),
    }));
    expect(response.body.tourInstance.status).toBe('hoan_thanh');
  });
});
