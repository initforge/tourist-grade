import type { BookingStatus, PaymentStatus, PrismaClient, RefundStatus, TourInstanceStatus } from '@prisma/client';
import {
  addDays,
  getFinalPaymentDueAt,
  normalizePaymentStatusAfterPartial,
  OVERDUE_DEPOSIT_CANCEL_REASON,
} from './customer.js';

export const UNPAID_BOOKING_TIMEOUT_MINUTES = 15;
export const UNPAID_BOOKING_CANCEL_REASON = 'Quá hạn thanh toán giữ chỗ';
export const CANCEL_REQUEST_AUTO_CONFIRM_HOURS = 24;
export const AUTO_CANCEL_CONFIRM_ACTOR = 'Hệ thống';
export const READY_FOR_OPERATIONS_STATUSES = ['DANG_MO_BAN'] satisfies TourInstanceStatus[];
export const MIN_CONFIRMED_DEPARTURE_GUESTS = 10;

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
        refundStatus: 'NOT_REQUIRED' satisfies RefundStatus,
        cancellationReason: OVERDUE_DEPOSIT_CANCEL_REASON,
        cancelledAt: now,
      },
    });
    expiredCount += 1;
  }

  return { count: expiredCount };
}

export function getCancelRequestAutoConfirmCutoff(now = new Date()) {
  return new Date(now.getTime() - CANCEL_REQUEST_AUTO_CONFIRM_HOURS * 60 * 60 * 1000);
}

export async function autoConfirmOverdueCancelRequests(prisma: PrismaClient, now = new Date()) {
  const overdueBookings = await prisma.booking.findMany({
    where: {
      status: 'PENDING_CANCEL' satisfies BookingStatus,
      cancelledAt: { lte: getCancelRequestAutoConfirmCutoff(now) },
    },
  });

  let confirmedCount = 0;

  for (const booking of overdueBookings) {
    const existingPayload = ((booking.payloadJson as Record<string, unknown> | null) ?? {});
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'CONFIRMED' satisfies BookingStatus,
        refundStatus: 'NONE' satisfies RefundStatus,
        cancellationReason: null,
        cancelledAt: null,
        refundAmount: null,
        payloadJson: {
          ...existingPayload,
          cancelRequestAutoResolvedBy: AUTO_CANCEL_CONFIRM_ACTOR,
          cancelRequestAutoResolvedAt: now.toISOString(),
          cancelRequestAutoResolvedAction: 'returned_to_confirmed',
        },
      },
    });
    confirmedCount += 1;
  }

  return { count: confirmedCount };
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

export async function promoteReadyTourInstances(prisma: PrismaClient, now = new Date()) {
  const candidates = await prisma.tourInstance.findMany({
    where: {
      status: { in: READY_FOR_OPERATIONS_STATUSES },
      bookingDeadlineAt: { lte: now },
    },
    include: {
      bookings: {
        include: {
          passengers: true,
        },
      },
    },
  });

  const readyIds = candidates
    .filter((instance) => {
      const relevantBookings = instance.bookings.filter((booking) => booking.status !== 'CANCELLED');
      const allBookingsResolved = relevantBookings.every((booking) => (
        booking.status === 'CONFIRMED' || booking.status === 'COMPLETED'
      ));
      const confirmedGuestCount = relevantBookings
        .filter((booking) => booking.status === 'CONFIRMED' || booking.status === 'COMPLETED')
        .reduce((sum, booking) => sum + booking.passengers.length, 0);

      return relevantBookings.length > 0
        && allBookingsResolved
        && confirmedGuestCount >= MIN_CONFIRMED_DEPARTURE_GUESTS;
    })
    .map((instance) => instance.id);

  if (readyIds.length === 0) {
    return { count: 0 };
  }

  return prisma.tourInstance.updateMany({
    where: {
      id: { in: readyIds },
      status: { in: READY_FOR_OPERATIONS_STATUSES },
    },
    data: {
      status: 'CHO_NHAN_DIEU_HANH' satisfies TourInstanceStatus,
    },
  });
}

export async function markUnderfilledTourInstances(prisma: PrismaClient, now = new Date()) {
  const candidates = await prisma.tourInstance.findMany({
    where: {
      status: { in: READY_FOR_OPERATIONS_STATUSES },
      bookingDeadlineAt: { lte: now },
    },
    include: {
      bookings: {
        include: {
          passengers: true,
        },
      },
    },
  });

  const underfilledIds = candidates
    .filter((instance) => {
      const confirmedGuestCount = instance.bookings
        .filter((booking) => booking.status === 'CONFIRMED' || booking.status === 'COMPLETED')
        .reduce((sum, booking) => sum + booking.passengers.length, 0);
      return confirmedGuestCount < MIN_CONFIRMED_DEPARTURE_GUESTS;
    })
    .map((instance) => instance.id);

  if (underfilledIds.length === 0) {
    return { count: 0 };
  }

  return prisma.tourInstance.updateMany({
    where: {
      id: { in: underfilledIds },
      status: { in: READY_FOR_OPERATIONS_STATUSES },
    },
    data: {
      status: 'CHUA_DU_KIEN' satisfies TourInstanceStatus,
    },
  });
}

export async function runBookingLifecycleJobs(prisma: PrismaClient, now = new Date()) {
  await expireUnpaidBookings(prisma, now);
  await expireOverdueDepositBookings(prisma, now);
  await autoConfirmOverdueCancelRequests(prisma, now);
  await markUnderfilledTourInstances(prisma, now);
  await promoteReadyTourInstances(prisma, now);
  await completeFinishedTourBookings(prisma, now);
}
