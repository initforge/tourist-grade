import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  booking: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  paymentTransaction: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
};

const payosClientMock = {
  cancelPaymentLink: vi.fn(),
  createPaymentLink: vi.fn(),
  verifyPaymentWebhookData: vi.fn(),
  confirmWebhook: vi.fn(),
};

vi.mock('../lib/prisma.js', () => ({
  prisma: prismaMock,
}));

vi.mock('../lib/payos.js', () => ({
  getPayOSClient: () => payosClientMock,
}));

const { createPaymentsRouter } = await import('./payments.js');

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/', createPaymentsRouter());
  app.use((error: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(error.status ?? 500).json({
      success: false,
      message: error.message,
    });
  });
  return app;
}

describe('payments routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.paymentTransaction.findMany.mockResolvedValue([]);
  });

  it('creates a PayOS link using the deposit amount when payment ratio is deposit', async () => {
    prismaMock.booking.findUnique.mockResolvedValue({
      id: 'B001',
      bookingCode: 'BK-582910',
      payloadJson: { paymentRatio: 'deposit' },
      totalAmount: 9000000,
      paidAmount: 0,
      remainingAmount: 9000000,
      contactName: 'Nguyen Van A',
      contactEmail: 'nguyenvana@gmail.com',
      contactPhone: '0988888888',
      tourInstance: {},
    });
    payosClientMock.createPaymentLink.mockResolvedValue({
      checkoutUrl: 'https://pay.payos.vn/checkout/demo',
      paymentLinkId: 'plink_001',
    });

    const response = await request(createTestApp()).post('/bookings/B001/payos-link');

    expect(response.status).toBe(200);
    expect(payosClientMock.createPaymentLink).toHaveBeenCalledWith(expect.objectContaining({
      amount: 4500000,
      description: 'Thanh toan BK582910',
      buyerEmail: 'nguyenvana@gmail.com',
    }));
    expect(prismaMock.paymentTransaction.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        bookingId: 'B001',
        amount: 4500000,
        method: 'PAYOS',
        status: 'UNPAID',
        transactionRef: 'plink_001',
      }),
    }));
    expect(response.body.paymentLink.checkoutUrl).toBe('https://pay.payos.vn/checkout/demo');
  });

  it('cancels existing unpaid PayOS links before creating a new payment request', async () => {
    prismaMock.booking.findUnique.mockResolvedValue({
      id: 'B003',
      bookingCode: 'BK-394821',
      payloadJson: { paymentRatio: 'full' },
      totalAmount: 56000000,
      paidAmount: 28000000,
      remainingAmount: 28000000,
      contactName: 'Nguyen Van A',
      contactEmail: 'nguyenvana@gmail.com',
      contactPhone: '0988888888',
      tourInstance: {},
    });
    prismaMock.paymentTransaction.findMany.mockResolvedValue([{
      id: 'TX_UNPAID',
      bookingId: 'B003',
      orderCode: '111222333',
      method: 'PAYOS',
      status: 'UNPAID',
      payloadJson: {
        checkoutUrl: 'https://pay.payos.vn/checkout/existing',
        paymentLinkId: 'plink_existing',
      },
    }]);
    payosClientMock.cancelPaymentLink.mockResolvedValue({ status: 'CANCELLED' });
    payosClientMock.createPaymentLink.mockResolvedValue({
      checkoutUrl: 'https://pay.payos.vn/checkout/new',
      paymentLinkId: 'plink_new',
    });

    const response = await request(createTestApp()).post('/bookings/B003/payos-link');

    expect(response.status).toBe(200);
    expect(payosClientMock.cancelPaymentLink).toHaveBeenCalledWith('111222333', expect.any(String));
    expect(prismaMock.paymentTransaction.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'TX_UNPAID' },
      data: expect.objectContaining({ status: 'CANCELLED' }),
    }));
    expect(payosClientMock.createPaymentLink).toHaveBeenCalledWith(expect.objectContaining({ amount: 28000000 }));
    expect(response.body.paymentLink.checkoutUrl).toBe('https://pay.payos.vn/checkout/new');
    expect(prismaMock.paymentTransaction.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        bookingId: 'B003',
        status: 'UNPAID',
        transactionRef: 'plink_new',
      }),
    }));
  });

  it('marks a payment as paid and updates booking balances from webhook data', async () => {
    payosClientMock.verifyPaymentWebhookData.mockReturnValue({
      orderCode: 123456789,
      amount: 4500000,
      code: '00',
      transactionDateTime: '2026-04-24T10:00:00.000Z',
      reference: 'PAYOS-REF-1',
    });
    prismaMock.paymentTransaction.findFirst.mockResolvedValue({
      id: 'TX001',
      bookingId: 'B001',
      status: 'UNPAID',
      booking: {
        paidAmount: 4500000,
        totalAmount: 9000000,
      },
    });

    const response = await request(createTestApp())
      .post('/payos/webhook')
      .send({ data: 'payload' });

    expect(response.status).toBe(200);
    expect(prismaMock.paymentTransaction.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'TX001' },
      data: expect.objectContaining({
        status: 'PAID',
        transactionRef: 'PAYOS-REF-1',
      }),
    }));
    expect(prismaMock.booking.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'B001' },
      data: {
        paidAmount: 9000000,
        remainingAmount: 0,
        paymentStatus: 'PAID',
      },
    }));
  });

  it('does not apply webhook money twice for an already paid transaction', async () => {
    payosClientMock.verifyPaymentWebhookData.mockReturnValue({
      orderCode: 987654321,
      amount: 4500000,
      status: 'PAID',
      transactionDateTime: '2026-04-24T10:00:00.000Z',
      reference: 'PAYOS-REF-2',
    });
    prismaMock.paymentTransaction.findFirst.mockResolvedValue({
      id: 'TX002',
      bookingId: 'B001',
      status: 'PAID',
      booking: {
        paidAmount: 9000000,
        totalAmount: 9000000,
      },
    });

    const response = await request(createTestApp())
      .post('/payos/webhook')
      .send({ data: 'payload' });

    expect(response.status).toBe(200);
    expect(prismaMock.paymentTransaction.update).not.toHaveBeenCalled();
    expect(prismaMock.booking.update).not.toHaveBeenCalled();
  });

  it('marks an unpaid PayOS transaction as cancelled from webhook without changing booking money', async () => {
    payosClientMock.verifyPaymentWebhookData.mockReturnValue({
      orderCode: 333444555,
      amount: 28000000,
      status: 'CANCELLED',
      transactionDateTime: '2026-04-24T10:00:00.000Z',
      reference: 'PAYOS-CANCEL-1',
    });
    prismaMock.paymentTransaction.findFirst.mockResolvedValue({
      id: 'TX_CANCELLED',
      bookingId: 'B003',
      status: 'UNPAID',
      booking: {
        paidAmount: 28000000,
        totalAmount: 56000000,
      },
    });

    const response = await request(createTestApp())
      .post('/payos/webhook')
      .send({ data: 'cancelled payload' });

    expect(response.status).toBe(200);
    expect(prismaMock.paymentTransaction.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'TX_CANCELLED' },
      data: expect.objectContaining({ status: 'CANCELLED' }),
    }));
    expect(prismaMock.booking.update).not.toHaveBeenCalled();
  });

  it('ignores stale paid webhooks for locally cancelled PayOS transactions', async () => {
    payosClientMock.verifyPaymentWebhookData.mockReturnValue({
      orderCode: 444555666,
      amount: 28000000,
      status: 'PAID',
      transactionDateTime: '2026-04-24T10:00:00.000Z',
      reference: 'PAYOS-STALE-PAID',
    });
    prismaMock.paymentTransaction.findFirst.mockResolvedValue({
      id: 'TX_STALE',
      bookingId: 'B003',
      status: 'CANCELLED',
      booking: {
        paidAmount: 28000000,
        totalAmount: 56000000,
      },
    });

    const response = await request(createTestApp())
      .post('/payos/webhook')
      .send({ data: 'stale paid payload' });

    expect(response.status).toBe(200);
    expect(prismaMock.paymentTransaction.update).not.toHaveBeenCalled();
    expect(prismaMock.booking.update).not.toHaveBeenCalled();
  });

  it('rejects payment link creation when the booking has no remaining balance', async () => {
    prismaMock.booking.findUnique.mockResolvedValue({
      id: 'B001',
      bookingCode: 'BK-582910',
      payloadJson: { paymentRatio: 'full' },
      totalAmount: 9000000,
      paidAmount: 9000000,
      remainingAmount: 0,
      contactName: 'Nguyen Van A',
      contactEmail: 'nguyenvana@gmail.com',
      contactPhone: '0988888888',
      tourInstance: {},
    });

    const response = await request(createTestApp()).post('/bookings/B001/payos-link');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Booking has no remaining balance');
    expect(payosClientMock.createPaymentLink).not.toHaveBeenCalled();
    expect(prismaMock.paymentTransaction.create).not.toHaveBeenCalled();
  });
});
