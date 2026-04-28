import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  paymentTransaction: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  tourProgram: {
    findFirst: vi.fn(),
  },
  tourInstance: {
    findFirst: vi.fn(),
  },
  voucher: {
    findFirst: vi.fn(),
  },
  booking: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  emailOutbox: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
};

const payosClientMock = {
  getPaymentLinkInformation: vi.fn(),
};

vi.mock('../lib/prisma.js', () => ({
  prisma: prismaMock,
}));

vi.mock('../middleware/auth.js', () => ({
  authenticate: (req: express.Request & { auth?: unknown }, _res: express.Response, next: express.NextFunction) => {
    req.auth = {
      sub: 'customer-1',
      role: 'customer',
      name: 'Le Van C',
    };
    next();
  },
  authenticateOptional: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

vi.mock('../lib/payos.js', () => ({
  getPayOSClient: () => payosClientMock,
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
    review: null,
    tourInstance: {
      id: 'TI003',
      code: 'TI003',
      programId: 'program-1',
      programNameSnapshot: 'Amanoi Ninh Thuan',
      departureDate: new Date('2026-10-15T00:00:00.000Z'),
      program: {
        code: 'TP002',
        slug: 'amanoi-ninh-thuan',
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
    prismaMock.voucher.findFirst.mockResolvedValue(null);
    prismaMock.booking.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.booking.findMany.mockResolvedValue([]);
    prismaMock.paymentTransaction.findFirst.mockResolvedValue(null);
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof prismaMock) => Promise<unknown>) => callback(prismaMock));
  });

  it('looks up a booking when phone formatting differs', async () => {
    prismaMock.booking.findFirst.mockResolvedValue(createBookingFixture());

    const response = await request(createTestApp())
      .get('/lookup')
      .query({ bookingCode: 'BK-394821', contact: '0912345678' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.booking.bookingCode).toBe('BK-394821');
    expect(response.body.booking.tourDuration).toContain('4N3');
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

  it('synchronizes a paid PayOS booking during lookup when the webhook has not updated the database yet', async () => {
    const unpaidBooking = {
      ...createBookingFixture(),
      id: 'B500',
      bookingCode: 'BK-500000',
      paymentMethod: 'PAYOS',
      paymentStatus: 'UNPAID',
      paidAmount: 0,
      remainingAmount: 56000000,
      paymentTransactions: [],
    };
    prismaMock.booking.findFirst
      .mockResolvedValueOnce(unpaidBooking)
      .mockResolvedValueOnce({
        ...unpaidBooking,
        paymentStatus: 'PAID',
        paidAmount: 56000000,
        remainingAmount: 0,
      });
    prismaMock.paymentTransaction.findFirst.mockResolvedValue({
      id: 'TX500',
      bookingId: 'B500',
      status: 'UNPAID',
      orderCode: '500001',
      transactionRef: 'plink_500',
      amount: 56000000,
      booking: {
        id: 'B500',
        bookingCode: 'BK-500000',
        contactEmail: 'LeVanC@Example.com',
        status: 'PENDING',
        paidAmount: 0,
        totalAmount: 56000000,
      },
    });
    payosClientMock.getPaymentLinkInformation.mockResolvedValue({
      id: 'plink_500',
      orderCode: 500001,
      amount: 56000000,
      amountPaid: 56000000,
      amountRemaining: 0,
      status: 'PAID',
      createdAt: '2026-04-28T10:00:00.000Z',
      transactions: [{
        reference: 'PAYOS-500',
        amount: 56000000,
        accountNumber: '1234567890',
        description: 'Thanh toan',
        transactionDateTime: '2026-04-28T10:01:00.000Z',
        virtualAccountName: 'TRAVELA',
        virtualAccountNumber: '999999999',
        counterAccountBankId: 'VCB',
        counterAccountBankName: 'Vietcombank',
        counterAccountName: 'LE VAN C',
        counterAccountNumber: '1234567890',
      }],
      cancellationReason: null,
      canceledAt: null,
    });
    prismaMock.booking.update.mockResolvedValue({
      id: 'B500',
      bookingCode: 'BK-500000',
      contactEmail: 'LeVanC@Example.com',
      status: 'PENDING',
      paidAmount: 56000000,
      remainingAmount: 0,
      paymentStatus: 'PAID',
      totalAmount: 56000000,
    });

    const response = await request(createTestApp())
      .get('/lookup')
      .query({ bookingCode: 'BK-500000', contact: 'levanc@example.com' });

    expect(response.status).toBe(200);
    expect(prismaMock.paymentTransaction.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'TX500' },
      data: expect.objectContaining({ status: 'PAID' }),
    }));
    expect(prismaMock.emailOutbox.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        template: 'booking_payment_received',
        bookingId: 'B500',
      }),
    }));
    expect(response.body.booking.paymentStatus).toBe('paid');
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
        cancellationReason: 'Khach hang gui yeu cau huy',
        refundAmount: 700000,
      }),
    }));
    expect(response.body.booking.status).toBe('pending_cancel');
    expect(prismaMock.emailOutbox.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        template: 'booking_cancel_requested',
        bookingId: 'B001',
      }),
    }));
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

  it('creates a public booking from the live tour instance price instead of a stale public schedule snapshot', async () => {
    prismaMock.tourProgram.findFirst.mockResolvedValue({
      id: 'program-1',
      code: 'TP001',
      slug: 'kham-pha-vinh-ha-long-du-thuyen-5-sao',
      publicContentJson: {
        id: 'T001',
        slug: 'kham-pha-vinh-ha-long-du-thuyen-5-sao',
        departureSchedule: [
          {
            id: 'DS001-2',
            instanceCode: 'TI009',
            date: '2026-05-22',
            priceAdult: 72000,
            priceChild: 36000,
            priceInfant: 0,
            availableSeats: 20,
          },
        ],
      },
    });
    prismaMock.tourInstance.findFirst.mockResolvedValue({
      id: 'instance-1',
      code: 'TI009',
      programId: 'program-1',
      departureDate: new Date('2026-05-22T00:00:00.000Z'),
      bookingDeadlineAt: new Date('2026-05-10T00:00:00.000Z'),
      expectedGuests: 20,
      minParticipants: 10,
      priceAdult: { toNumber: () => 7200000 },
      priceChild: { toNumber: () => 3600000 },
      priceInfant: { toNumber: () => 0 },
      bookings: [],
    });
    prismaMock.booking.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...createBookingFixture(),
      id: 'B900',
      bookingCode: 'BK-900001',
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      tourInstance: {
        ...createBookingFixture().tourInstance,
        id: 'instance-1',
        code: 'TI009',
        programNameSnapshot: 'Khám Phá Vịnh Hạ Long - Du Thuyền 5 Sao',
        departureDate: new Date('2026-05-22T00:00:00.000Z'),
        program: {
          ...createBookingFixture().tourInstance.program,
          code: 'TP001',
          slug: 'kham-pha-vinh-ha-long-du-thuyen-5-sao',
          durationDays: 3,
          durationNights: 2,
          publicContentJson: { id: 'T001' },
        },
      },
      totalAmount: 7200000,
      remainingAmount: 7200000,
      paidAmount: 0,
      payloadJson: data.payloadJson,
      passengers: [
        {
          id: 'P900',
          bookingId: 'B900',
          type: 'ADULT',
          fullName: 'Nguyen Van A',
          dateOfBirth: new Date('1990-01-01T00:00:00.000Z'),
          gender: 'MALE',
          cccd: '001090123456',
          nationality: 'Việt Nam',
          singleRoomSupplement: 0,
          createdAt: new Date('2026-04-28T00:00:00.000Z'),
        },
      ],
    }));

    const response = await request(createTestApp())
      .post('/public')
      .send({
        tourSlug: 'kham-pha-vinh-ha-long-du-thuyen-5-sao',
        scheduleId: 'DS001-2',
        contact: {
          name: 'Nguyen Van A',
          phone: '0901234567',
          email: 'nguyenvana@example.com',
          note: '',
        },
        passengers: [
          {
            type: 'adult',
            name: 'Nguyen Van A',
            dob: '1990-01-01',
            gender: 'male',
            cccd: '001090123456',
            nationality: 'Việt Nam',
          },
        ],
        roomCounts: { single: 0, double: 1, triple: 0 },
        promoCode: '',
        paymentRatio: 'full',
        paymentMethod: 'bank',
      });

    expect(response.status).toBe(201);
    expect(prismaMock.booking.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: 'PENDING',
        totalAmount: 7200000,
        remainingAmount: 7200000,
        discountAmount: 0,
      }),
    }));
    expect(response.body.booking.totalAmount).toBe(7200000);
  });

  it('allows checkout updates to reuse seats already held by the same booking', async () => {
    const existingBooking = {
      ...createBookingFixture(),
      id: 'B777',
      bookingCode: 'BK-777777',
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      tourInstance: {
        ...createBookingFixture().tourInstance,
        code: 'TI009',
        program: {
          ...createBookingFixture().tourInstance.program,
          slug: 'kham-pha-vinh-ha-long-du-thuyen-5-sao',
        },
      },
      passengers: [
        {
          id: 'PX1',
          bookingId: 'B777',
          type: 'ADULT',
          fullName: 'Khach cu',
          dateOfBirth: new Date('1990-01-01T00:00:00.000Z'),
          gender: 'MALE',
          cccd: '001090123456',
          nationality: 'Viá»‡t Nam',
          singleRoomSupplement: 0,
          createdAt: new Date('2026-04-28T00:00:00.000Z'),
        },
      ],
    };

    prismaMock.booking.findFirst.mockResolvedValue(existingBooking);
    prismaMock.tourProgram.findFirst.mockResolvedValue({
      id: 'program-1',
      code: 'TP001',
      slug: 'kham-pha-vinh-ha-long-du-thuyen-5-sao',
      publicContentJson: {
        id: 'T001',
        slug: 'kham-pha-vinh-ha-long-du-thuyen-5-sao',
        departureSchedule: [
          {
            id: 'DS001-2',
            instanceCode: 'TI009',
            date: '2026-05-22',
            priceAdult: 72000,
            priceChild: 36000,
            priceInfant: 0,
            availableSeats: 1,
          },
        ],
      },
    });
    prismaMock.tourInstance.findFirst.mockResolvedValue({
      id: 'instance-1',
      code: 'TI009',
      programId: 'program-1',
      departureDate: new Date('2026-05-22T00:00:00.000Z'),
      bookingDeadlineAt: new Date('2026-05-10T00:00:00.000Z'),
      expectedGuests: 3,
      minParticipants: 1,
      priceAdult: { toNumber: () => 7200000 },
      priceChild: { toNumber: () => 3600000 },
      priceInfant: { toNumber: () => 0 },
      bookings: [
        {
          id: 'B777',
          status: 'PENDING',
          passengers: [{ id: 'PX1' }],
        },
        {
          id: 'B778',
          status: 'PENDING',
          passengers: [{ id: 'PX2' }],
        },
      ],
    });
    prismaMock.booking.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...existingBooking,
      ...data,
      totalAmount: 14400000,
      remainingAmount: 14400000,
      passengers: [
        {
          id: 'PX1',
          bookingId: 'B777',
          type: 'ADULT',
          fullName: 'Khach 1',
          dateOfBirth: new Date('1990-01-01T00:00:00.000Z'),
          gender: 'MALE',
          cccd: '001090123456',
          nationality: 'Viá»‡t Nam',
          singleRoomSupplement: 0,
          createdAt: new Date('2026-04-28T00:00:00.000Z'),
        },
        {
          id: 'PX2',
          bookingId: 'B777',
          type: 'ADULT',
          fullName: 'Khach 2',
          dateOfBirth: new Date('1991-02-02T00:00:00.000Z'),
          gender: 'FEMALE',
          cccd: '001091123456',
          nationality: 'Viá»‡t Nam',
          singleRoomSupplement: 0,
          createdAt: new Date('2026-04-28T00:00:00.000Z'),
        },
      ],
    }));

    const response = await request(createTestApp())
      .put('/B777/checkout')
      .send({
        scheduleId: 'DS001-2',
        contact: {
          name: 'Le Van C',
          phone: '0912345678',
          email: 'LeVanC@Example.com',
          note: '',
        },
        passengers: [
          {
            type: 'adult',
            name: 'Khach 1',
            dob: '1990-01-01',
            gender: 'male',
            cccd: '001090123456',
            nationality: 'Viá»‡t Nam',
          },
          {
            type: 'adult',
            name: 'Khach 2',
            dob: '1991-02-02',
            gender: 'female',
            cccd: '001091123456',
            nationality: 'Viá»‡t Nam',
          },
        ],
        roomCounts: { single: 0, double: 1, triple: 0 },
        promoCode: '',
        paymentRatio: 'full',
        paymentMethod: 'bank',
      });

    expect(response.status).toBe(200);
    expect(response.body.booking.totalAmount).toBe(14400000);
  });
});
