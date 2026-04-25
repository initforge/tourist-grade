import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  booking: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock('../lib/prisma.js', () => ({
  prisma: prismaMock,
}));

const { createBookingsRouter } = await import('./bookings.js');

function createBookingFixture() {
  return {
    id: 'B001',
    bookingCode: 'BK-394821',
    userId: 'customer-1',
    status: 'PENDING',
    refundStatus: 'NONE',
    paymentMethod: 'PAYOS',
    paymentType: 'ONLINE',
    paymentStatus: 'PARTIAL',
    contactName: 'Le Van C',
    contactEmail: 'LeVanC@Example.com',
    contactPhone: '0912 345 678',
    contactNote: '',
    payloadJson: { paymentRatio: 'deposit' },
    bankInfoJson: null,
    roomCountsJson: { single: 1, double: 1, triple: 0 },
    totalAmount: 56000000,
    paidAmount: 28000000,
    remainingAmount: 28000000,
    discountAmount: 0,
    refundAmount: null,
    refundBillUrl: null,
    cancellationReason: null,
    cancelledAt: null,
    confirmedById: null,
    confirmedAt: null,
    refundedById: null,
    refundedAt: null,
    createdAt: new Date('2026-03-24T14:20:00Z'),
    updatedAt: new Date('2026-03-24T14:20:00Z'),
    passengers: [
      {
        id: 'P1',
        bookingId: 'B001',
        type: 'ADULT',
        fullName: 'Le Van C',
        dateOfBirth: new Date('1990-03-15'),
        gender: 'MALE',
        cccd: '001090034567',
        nationality: 'Viet Nam',
        singleRoomSupplement: 500000,
        createdAt: new Date('2026-03-24T14:20:00Z'),
      },
    ],
    paymentTransactions: [],
    tourInstance: {
      id: 'TI003',
      code: 'TI003',
      programId: 'program-1',
      programNameSnapshot: 'Amanoi Ninh Thuan',
      departureDate: new Date('2026-10-15T00:00:00.000Z'),
      program: {
        code: 'TP002',
        durationDays: 4,
        durationNights: 3,
        publicContentJson: { id: 'T002' },
      },
    },
  };
}

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/', createBookingsRouter());
  app.use((error: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(error.status ?? 500).json({
      success: false,
      message: error.message,
    });
  });
  return app;
}

describe('bookings routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('looks up a booking when phone formatting differs', async () => {
    prismaMock.booking.findFirst.mockResolvedValue(createBookingFixture());

    const response = await request(createTestApp())
      .get('/lookup')
      .query({ bookingCode: 'BK-394821', contact: '0912345678' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.booking.bookingCode).toBe('BK-394821');
    expect(response.body.booking.tourDuration).toBe('4N3Đ');
  });

  it('looks up a booking when email case differs', async () => {
    prismaMock.booking.findFirst.mockResolvedValue(createBookingFixture());

    const response = await request(createTestApp())
      .get('/lookup')
      .query({ bookingCode: 'BK-394821', contact: 'levanc@example.com' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.booking.contactInfo.email).toBe('LeVanC@Example.com');
  });

  it('creates a cancel request with the expected refund amount and default reason', async () => {
    const booking = {
      ...createBookingFixture(),
      paymentStatus: 'PAID',
      paidAmount: 1000000,
      remainingAmount: 0,
      tourInstance: {
        ...createBookingFixture().tourInstance,
        departureDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      },
    };

    prismaMock.booking.findUnique.mockResolvedValue(booking);
    prismaMock.booking.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...booking,
      ...data,
    }));

    const response = await request(createTestApp())
      .post('/B001/cancel-request')
      .send({
        contact: 'LEVANC@EXAMPLE.COM',
        bankInfo: {
          bankName: 'Vietcombank',
          accountNumber: '1234567890',
          accountHolder: 'LE VAN C',
        },
      });

    expect(response.status).toBe(200);
    expect(prismaMock.booking.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'B001' },
      data: expect.objectContaining({
        status: 'PENDING_CANCEL',
        refundStatus: 'PENDING',
        cancellationReason: 'Khách hàng gửi yêu cầu hủy',
        refundAmount: 700000,
      }),
    }));
    expect(response.body.booking.status).toBe('pending_cancel');
  });

  it('rejects a cancel request when contact verification fails', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(createBookingFixture());

    const response = await request(createTestApp())
      .post('/B001/cancel-request')
      .send({
        contact: 'wrong-contact',
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Contact verification failed');
    expect(prismaMock.booking.update).not.toHaveBeenCalled();
  });
});
