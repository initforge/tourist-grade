import type { BookingStatus, PaymentStatus, PrismaClient, RefundStatus } from '@prisma/client';
import {
  getFinalPaymentDueAt,
  normalizePaymentStatusAfterPartial,
  OVERDUE_DEPOSIT_CANCEL_REASON,
} from './customer.js';

export const UNPAID_BOOKING_TIMEOUT_MINUTES = 15;
export const UNPAID_BOOKING_CANCEL_REASON = 'Khong thanh toan dung han';

export function getUnpaidBookingExpiryCutoff(now = new Date()) {
  return new Date(now.getTime() - UNPAID_BOOKING_TIMEOUT_MINUTES * 60 * 1000);
}

export async function expireUnpaidBookings(prisma: PrismaClient, now = new Date()) {
  return prisma.booking.updateMany({
    where: {
      status: { in: ['PENDING', 'BOOKED'] satisfies BookingStatus[] },
      paymentStatus: 'UNPAID' satisfies PaymentStatus,
      createdAt: { lte: getUnpaidBookingExpiryCutoff(now) },
    },
    data: {
      status: 'CANCELLED' satisfies BookingStatus,
      refundStatus: 'NOT_REQUIRED' satisfies RefundStatus,
      cancellationReason: UNPAID_BOOKING_CANCEL_REASON,
      cancelledAt: now,
    },
  });
}

export async function expireOverdueDepositBookings(prisma: PrismaClient, now = new Date()) {
  const partialBookings = await prisma.booking.findMany({
    where: {
      status: { in: ['PENDING', 'CONFIRMED'] satisfies BookingStatus[] },
      paymentStatus: 'PARTIAL' satisfies PaymentStatus,
    },
    include: {
      tourInstance: true,
    },
  });

  let expiredCount = 0;

  for (const booking of partialBookings) {
    const payload = (booking.payloadJson as { paymentRatio?: string } | null) ?? {};
    if (payload.paymentRatio !== 'deposit') {
      continue;
    }

    const totalAmount = Number(booking.totalAmount);
    const paidAmount = Number(booking.paidAmount);
    if (Number(booking.remainingAmount) <= 0) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: normalizePaymentStatusAfterPartial(totalAmount, paidAmount),
        },
      });
      continue;
    }

    if (now < getFinalPaymentDueAt(booking.tourInstance.departureDate)) {
      continue;
    }

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'CANCELLED' satisfies BookingStatus,
        refundStatus: paidAmount > 0 ? ('PENDING' satisfies RefundStatus) : ('NOT_REQUIRED' satisfies RefundStatus),
        cancellationReason: OVERDUE_DEPOSIT_CANCEL_REASON,
        cancelledAt: now,
      },
    });
    expiredCount += 1;
  }

  return { count: expiredCount };
}
