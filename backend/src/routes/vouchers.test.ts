import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  user: {
    findUnique: vi.fn(),
  },
  voucher: {
    updateMany: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  voucherTarget: {
    deleteMany: vi.fn(),
  },
  tourProgram: {
    findMany: vi.fn(),
  },
  $transaction: vi.fn(),
};

vi.mock('../lib/prisma.js', () => ({
  prisma: prismaMock,
}));

vi.mock('../lib/jwt.js', () => ({
  verifyAccessToken: (token: string) => ({
    sub: token === 'manager-token' ? 'manager-1' : 'sales-1',
    role: token === 'manager-token' ? 'manager' : 'sales',
    email: token === 'manager-token' ? 'manager@travela.vn' : 'sales@travela.vn',
    name: token === 'manager-token' ? 'Quản lý' : 'Nhân viên kinh doanh',
  }),
}));

const { createVouchersRouter } = await import('./vouchers.js');

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/', createVouchersRouter());
  app.use((error: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(error.status ?? 500).json({
      success: false,
      message: error.message,
    });
  });
  return app;
}

function createVoucherFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'voucher-1',
    code: 'SUMMER2026',
    type: 'PERCENT',
    valueAmount: 20,
    startsAt: new Date('2026-06-01T00:00:00.000Z'),
    endsAt: new Date('2026-08-31T00:00:00.000Z'),
    usageLimit: 200,
    usedCount: 0,
    status: 'DRAFT',
    description: null,
    rejectionReason: null,
    createdById: 'sales-1',
    approvedById: null,
    rejectedById: null,
    createdAt: new Date('2026-04-01T00:00:00.000Z'),
    updatedAt: new Date('2026-04-01T00:00:00.000Z'),
    targets: [],
    ...overrides,
  };
}

describe('voucher routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.user.findUnique.mockResolvedValue({ id: 'sales-1', status: 'ACTIVE' });
    prismaMock.voucher.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.voucher.findMany.mockResolvedValue([]);
    prismaMock.tourProgram.findMany.mockResolvedValue([]);
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof prismaMock) => Promise<unknown>) => callback(prismaMock));
  });

  it('rejects overdue draft vouchers before returning the list', async () => {
    prismaMock.voucher.findMany.mockResolvedValue([
      createVoucherFixture({
        status: 'REJECTED',
        rejectionReason: 'Quá hạn gửi phê duyệt',
      }),
    ]);

    const response = await request(createTestApp())
      .get('/')
      .set('Authorization', 'Bearer sales-token');

    expect(response.status).toBe(200);
    expect(prismaMock.voucher.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        status: 'DRAFT',
        startsAt: { lt: expect.any(Date) },
      }),
      data: {
        status: 'REJECTED',
        rejectionReason: 'Quá hạn gửi phê duyệt',
      },
    }));
    expect(response.body.vouchers[0].status).toBe('rejected');
    expect(response.body.vouchers[0].rejectionReason).toBe('Quá hạn gửi phê duyệt');
  });

  it('allows sales to send an existing voucher for approval through the backend', async () => {
    const existing = createVoucherFixture();
    const pending = createVoucherFixture({ status: 'PENDING_APPROVAL' });
    prismaMock.voucher.findUnique.mockResolvedValue(existing);
    prismaMock.voucher.update.mockResolvedValue(pending);

    const response = await request(createTestApp())
      .patch('/voucher-1')
      .set('Authorization', 'Bearer sales-token')
      .send({ status: 'pending_approval' });

    expect(response.status).toBe(200);
    expect(prismaMock.voucher.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'voucher-1' },
      data: expect.objectContaining({
        status: 'PENDING_APPROVAL',
      }),
    }));
    expect(response.body.voucher.status).toBe('pending_approval');
  });

  it('allows manager approval to activate a pending voucher', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'manager-1', status: 'ACTIVE' });
    prismaMock.voucher.findUnique.mockResolvedValue(createVoucherFixture({ status: 'PENDING_APPROVAL' }));
    prismaMock.voucher.update.mockResolvedValue(createVoucherFixture({ status: 'ACTIVE', approvedById: 'manager-1' }));

    const response = await request(createTestApp())
      .post('/voucher-1/approve')
      .set('Authorization', 'Bearer manager-token');

    expect(response.status).toBe(200);
    expect(prismaMock.voucher.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'voucher-1' },
      data: expect.objectContaining({
        status: 'ACTIVE',
        approvedById: 'manager-1',
        rejectedById: null,
        rejectionReason: null,
      }),
    }));
    expect(response.body.voucher.status).toBe('upcoming');
  });
});
