import type { PrismaClient, Voucher } from '@prisma/client';
import { calculateAvailableSeats } from './customer.js';
import { queueEmail } from './email-outbox.js';

type WishlistReminderWriter = PrismaClient;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatVoucherValue(voucher: Pick<Voucher, 'type' | 'valueAmount'>) {
  const value = Number(voucher.valueAmount);
  if (voucher.type === 'PERCENT') {
    return `${Math.round(value)}%`;
  }

  return `${Math.round(value).toLocaleString('vi-VN')} VND`;
}

function getPublicTourId(publicContentJson: unknown, fallback: string) {
  if (publicContentJson && typeof publicContentJson === 'object') {
    const value = (publicContentJson as Record<string, unknown>).id;
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return fallback;
}

export async function sendWishlistReminderEmails(prisma: WishlistReminderWriter, now = new Date()) {
  const today = startOfDay(now);
  const [items, globalVouchers] = await Promise.all([
    prisma.wishlistItem.findMany({
      where: {
        user: { status: 'ACTIVE' },
        tourProgram: { status: 'ACTIVE' },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        tourProgram: {
          include: {
            instances: {
              where: {
                status: 'DANG_MO_BAN',
                bookingDeadlineAt: { gt: now },
                departureDate: { gte: today },
              },
              include: {
                bookings: {
                  where: { status: { not: 'CANCELLED' } },
                  include: { passengers: true },
                },
              },
            },
            voucherTargets: {
              include: { voucher: true },
            },
          },
        },
      },
    }),
    prisma.voucher.findMany({
      where: {
        status: 'ACTIVE',
        startsAt: { lte: now },
        endsAt: { gte: now },
        targets: { none: {} },
      },
    }),
  ]);

  let sent = 0;
  let skipped = 0;

  for (const item of items) {
    const availableSeatValues = item.tourProgram.instances
      .map((instance) => calculateAvailableSeats(instance, instance.bookings))
      .filter((availableSeats) => availableSeats > 0);
    const lowSeatValue = availableSeatValues.find((availableSeats) => availableSeats < 5);
    const activeTargetedVouchers = item.tourProgram.voucherTargets
      .map((target) => target.voucher)
      .filter((voucher) => (
        voucher.status === 'ACTIVE'
        && voucher.startsAt <= now
        && voucher.endsAt >= now
        && voucher.usedCount < voucher.usageLimit
      ));
    const voucher = activeTargetedVouchers[0]
      ?? globalVouchers.find((globalVoucher) => globalVoucher.usedCount < globalVoucher.usageLimit)
      ?? null;
    const reasons = [
      lowSeatValue == null ? null : 'Sắp hết chỗ',
      voucher ? 'Có ưu đãi đang áp dụng' : null,
    ].filter((value): value is string => Boolean(value));

    if (reasons.length === 0) {
      skipped += 1;
      continue;
    }

    const alreadySent = await prisma.emailOutbox.findFirst({
      where: {
        template: 'wishlist_tour_reminder',
        recipient: item.user.email,
        createdAt: { gte: today },
        payloadJson: {
          path: ['tourProgramId'],
          equals: item.tourProgram.id,
        },
      },
      select: { id: true },
    });

    if (alreadySent) {
      skipped += 1;
      continue;
    }

    const publicTourId = getPublicTourId(item.tourProgram.publicContentJson, item.tourProgram.code);
    await queueEmail(prisma, {
      template: 'wishlist_tour_reminder',
      recipient: item.user.email,
      subject: `Travela nhắc tour yêu thích: ${item.tourProgram.name}`,
      createdById: item.user.id,
      payload: {
        contact: { name: item.user.fullName },
        tourProgramId: item.tourProgram.id,
        tourId: publicTourId,
        tourSlug: item.tourProgram.slug,
        tourName: item.tourProgram.name,
        tourUrl: `/tours/${item.tourProgram.slug}`,
        reasons,
        availableSeats: lowSeatValue ?? null,
        voucherCode: voucher?.code ?? null,
        discountValue: voucher ? formatVoucherValue(voucher) : null,
      },
    });
    sent += 1;
  }

  return {
    checked: items.length,
    sent,
    skipped,
  };
}
