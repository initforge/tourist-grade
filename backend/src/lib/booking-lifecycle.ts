import type { BookingStatus, PaymentStatus, PrismaClient, RefundStatus } from '@prisma/client';
import {
  addDays,
  getFinalPaymentDueAt,
  normalizePaymentStatusAfterPartial,
  OVERDUE_DEPOSIT_CANCEL_REASON,
} from './customer.js';

export const UNPAID_BOOKING_TIMEOUT_MINUTES = 15;
export const UNPAID_BOOKING_CANCEL_REASON = 'Quá hạn thanh toán giữ chỗ';

export async function normalizeLegacyBookedStatuses(prisma: PrismaClient) {
  return prisma.booking.updateMany({
    where: {
      status: 'PENDING' satisfies BookingStatus,
    },
    data: {
      status: 'PENDING' satisfies BookingStatus,
    },
  });
}

export function getUnpaidBookingExpiryCutoff(now = new Date()) {
  return new Date(now.getTime() - UNPAID_BOOKING_TIMEOUT_MINUTES * 60 * 1000);
}

export async function expireUnpaidBookings(prisma: PrismaClient, now = new Date()) {
  return prisma.booking.updateMany({
    where: {
      status: 'PENDING' satisfies BookingStatus,
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

const HO_CHI_MINH_TIME_ZONE = 'Asia/Ho_Chi_Minh';

function toUtcDateKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getHoChiMinhDateKey(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: HO_CHI_MINH_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value ?? '0000';
  const month = parts.find((part) => part.type === 'month')?.value ?? '00';
  const day = parts.find((part) => part.type === 'day')?.value ?? '00';
  return `${year}-${month}-${day}`;
}

export function getTourCompletionDate(departureDate: Date, durationDays: number) {
  const completionDate = addDays(
    new Date(Date.UTC(
      departureDate.getUTCFullYear(),
      departureDate.getUTCMonth(),
      departureDate.getUTCDate(),
    )),
    Math.max(0, durationDays - 1),
  );

  return toUtcDateKey(completionDate);
}

export function shouldMarkBookingCompleted(
  departureDate: Date,
  durationDays: number,
  now = new Date(),
) {
  return getHoChiMinhDateKey(now) > getTourCompletionDate(departureDate, durationDays);
}

export async function completeFinishedTourBookings(prisma: PrismaClient, now = new Date()) {
  const confirmedBookings = await prisma.booking.findMany({
    where: {
      status: 'CONFIRMED' satisfies BookingStatus,
    },
    include: {
      tourInstance: {
        include: {
          program: {
            select: {
              durationDays: true,
            },
          },
        },
      },
    },
  });

  const completedBookingIds = confirmedBookings
    .filter((booking) => shouldMarkBookingCompleted(
      booking.tourInstance.departureDate,
      booking.tourInstance.program.durationDays,
      now,
    ))
    .map((booking) => booking.id);

  if (completedBookingIds.length === 0) {
    return { count: 0 };
  }

  return prisma.booking.updateMany({
    where: {
      id: { in: completedBookingIds },
      status: 'CONFIRMED' satisfies BookingStatus,
    },
    data: {
      status: 'COMPLETED' satisfies BookingStatus,
    },
  });
}

export async function runBookingLifecycleJobs(prisma: PrismaClient, now = new Date()) {
  await expireUnpaidBookings(prisma, now);
  await expireOverdueDepositBookings(prisma, now);
  await completeFinishedTourBookings(prisma, now);
}
