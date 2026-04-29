import { Router } from 'express';
import { env } from '../config/env.js';
import { expireUnpaidBookings } from '../lib/booking-lifecycle.js';
import { asyncHandler } from '../lib/http.js';
import { mapBooking } from '../lib/mappers.js';
import {
  resetBookingFixtures,
  resetCustomerPublicFixtures,
  resetSpecialDayFixtures,
  resetTourProgramFixtures,
  resetTourWorkflowFixtures,
  resetVoucherFixtures,
} from '../lib/booking-fixtures.js';
import { prisma } from '../lib/prisma.js';

export function createDevRouter() {
  const router = Router();

  router.post('/reset-booking-fixtures', asyncHandler(async (_req, res) => {
    if (env.NODE_ENV === 'production') {
      res.status(404).json({ success: false, message: 'Route not found' });
      return;
    }

    await resetBookingFixtures(prisma);
    await resetCustomerPublicFixtures(prisma);
    await resetTourWorkflowFixtures(prisma);
    await resetTourProgramFixtures(prisma);
    await resetSpecialDayFixtures(prisma);
    await resetVoucherFixtures(prisma);

    res.json({
      success: true,
      reset: 'sales-fixtures',
    });
  }));

  router.post('/unpaid-booking-fixture', asyncHandler(async (req, res) => {
    if (env.NODE_ENV === 'production') {
      res.status(404).json({ success: false, message: 'Route not found' });
      return;
    }

    const minutesAgo = Math.max(0, Number(req.body?.minutesAgo ?? 5));
    const createdAt = new Date(Date.now() - minutesAgo * 60 * 1000);
    const [customer, instance] = await Promise.all([
      prisma.user.findUnique({ where: { email: 'customer@travela.vn' } }),
      prisma.tourInstance.findFirst({
        where: { code: 'TI009' },
        include: { program: true },
      }),
    ]);

    if (!customer || !instance) {
      throw new Error('Unpaid booking fixture dependencies are missing. Run the full seed first.');
    }

    await prisma.paymentTransaction.deleteMany({
      where: { bookingId: 'B012' },
    });
    await prisma.bookingPassenger.deleteMany({
      where: { bookingId: 'B012' },
    });

    const booking = await prisma.booking.upsert({
      where: { id: 'B012' },
      update: {
        bookingCode: 'BK-888012',
        tourInstanceId: instance.id,
        userId: customer.id,
        status: 'PENDING',
        refundStatus: 'NONE',
        paymentMethod: 'PAYOS',
        paymentType: 'ONLINE',
        paymentStatus: 'UNPAID',
        contactName: 'Khach Cho Thanh Toan',
        contactEmail: 'khachchothanhtoan@test.vn',
        contactPhone: '0909 123 456',
        contactNote: 'Fixture timeout booking',
        roomCountsJson: { single: 1, double: 0, triple: 0 },
        totalAmount: 12000000,
        paidAmount: 0,
        remainingAmount: 12000000,
        discountAmount: 0,
        cancellationReason: null,
        cancelledAt: null,
        refundAmount: null,
        refundBillUrl: null,
        confirmedById: null,
        confirmedAt: null,
        cancelledConfirmedById: null,
        cancelledConfirmedAt: null,
        refundedById: null,
        refundedAt: null,
        payloadJson: {
          paymentRatio: 'deposit',
          paymentMethod: 'bank',
        },
        createdAt,
        passengers: {
          create: [
            {
              type: 'ADULT',
              fullName: 'Khach Cho Thanh Toan',
              gender: 'MALE',
              dateOfBirth: new Date('1990-01-01'),
              cccd: '001090123456',
              nationality: 'Việt Nam',
            },
          ],
        },
      },
      create: {
        id: 'B012',
        bookingCode: 'BK-888012',
        tourInstanceId: instance.id,
        userId: customer.id,
        status: 'PENDING',
        refundStatus: 'NONE',
        paymentMethod: 'PAYOS',
        paymentType: 'ONLINE',
        paymentStatus: 'UNPAID',
        contactName: 'Khach Cho Thanh Toan',
        contactEmail: 'khachchothanhtoan@test.vn',
        contactPhone: '0909 123 456',
        contactNote: 'Fixture timeout booking',
        roomCountsJson: { single: 1, double: 0, triple: 0 },
        totalAmount: 12000000,
        paidAmount: 0,
        remainingAmount: 12000000,
        discountAmount: 0,
        payloadJson: {
          paymentRatio: 'deposit',
          paymentMethod: 'bank',
        },
        createdAt,
        passengers: {
          create: [
            {
              type: 'ADULT',
              fullName: 'Khach Cho Thanh Toan',
              gender: 'MALE',
              dateOfBirth: new Date('1990-01-01'),
              cccd: '001090123456',
              nationality: 'Việt Nam',
            },
          ],
        },
      },
      include: {
        passengers: true,
        paymentTransactions: true,
        confirmedBy: { select: { fullName: true } },
        cancelledConfirmedBy: { select: { fullName: true } },
        refundedBy: { select: { fullName: true } },
        tourInstance: {
          include: {
            program: true,
          },
        },
      },
    });

    res.json({
      success: true,
      booking: mapBooking(booking, {
        tourId:
          ((booking.tourInstance.program.publicContentJson as { id?: string } | null)?.id)
          ?? booking.tourInstance.program.code,
        tourName: booking.tourInstance.programNameSnapshot,
        tourDuration: `${booking.tourInstance.program.durationDays}N${booking.tourInstance.program.durationNights}D`,
        tourDate: booking.tourInstance.departureDate.toISOString().slice(0, 10),
      }),
    });
  }));

  router.post('/expire-unpaid-bookings', asyncHandler(async (_req, res) => {
    if (env.NODE_ENV === 'production') {
      res.status(404).json({ success: false, message: 'Route not found' });
      return;
    }

    const result = await expireUnpaidBookings(prisma);
    res.json({
      success: true,
      expired: result.count,
    });
  }));

  router.get('/email-outbox', asyncHandler(async (req, res) => {
    if (env.NODE_ENV === 'production') {
      res.status(404).json({ success: false, message: 'Route not found' });
      return;
    }

    const bookingCode = String(req.query.bookingCode ?? '').trim();
    const template = String(req.query.template ?? '').trim();
    const booking = bookingCode
      ? await prisma.booking.findFirst({
          where: {
            OR: [{ id: bookingCode }, { bookingCode }],
          },
          select: { id: true, bookingCode: true },
        })
      : null;
    const items = await prisma.emailOutbox.findMany({
      where: {
        ...(template ? { template } : {}),
        ...(booking ? { bookingId: booking.id } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });

    res.json({
      success: true,
      emails: items.map((item) => ({
        id: item.id,
        template: item.template,
        recipient: item.recipient,
        subject: item.subject,
        status: item.status,
        bookingCode: booking?.bookingCode ?? null,
        payload: item.payloadJson,
        createdAt: item.createdAt.toISOString(),
        sentAt: item.sentAt?.toISOString() ?? null,
      })),
    });
  }));

  return router;
}
