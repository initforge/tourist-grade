import type { PrismaClient } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { sendWishlistReminderEmails } from './wishlist-reminders.js';

function createPrismaMock(overrides: {
  items?: unknown[];
  globalVouchers?: unknown[];
  existingReminder?: unknown;
} = {}) {
  return {
    wishlistItem: {
      findMany: vi.fn().mockResolvedValue(overrides.items ?? []),
    },
    voucher: {
      findMany: vi.fn().mockResolvedValue(overrides.globalVouchers ?? []),
    },
    emailOutbox: {
      findFirst: vi.fn().mockResolvedValue(overrides.existingReminder ?? null),
      create: vi.fn().mockResolvedValue({ id: 'email-1' }),
    },
  } as unknown as PrismaClient;
}

function wishlistItemFixture(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-05-01T08:00:00.000Z');
  return {
    id: 'wishlist-1',
    user: {
      id: 'customer-1',
      email: 'customer@test.vn',
      fullName: 'Khách hàng',
    },
    tourProgram: {
      id: 'program-1',
      code: 'TP001',
      name: 'Khám phá Vịnh Hạ Long',
      slug: 'kham-pha-vinh-ha-long',
      publicContentJson: { id: 'T001' },
      instances: [
        {
          id: 'instance-1',
          expectedGuests: 6,
          bookings: [
            {
              id: 'booking-1',
              status: 'CONFIRMED',
              passengers: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }],
            },
          ],
        },
      ],
      voucherTargets: [],
    },
    createdAt: now,
    ...overrides,
  };
}

describe('sendWishlistReminderEmails', () => {
  it('queues a reminder when a wishlisted tour has fewer than 5 seats left', async () => {
    const prisma = createPrismaMock({
      items: [wishlistItemFixture()],
    });

    const result = await sendWishlistReminderEmails(prisma, new Date('2026-05-01T08:00:00.000Z'));

    expect(result).toEqual({ checked: 1, sent: 1, skipped: 0 });
    expect(prisma.emailOutbox.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        template: 'wishlist_tour_reminder',
        recipient: 'customer@test.vn',
        subject: 'Travela nhắc tour yêu thích: Khám phá Vịnh Hạ Long',
      }),
    }));
  });

  it('queues a reminder when a wishlisted tour has an active targeted voucher', async () => {
    const voucher = {
      id: 'voucher-1',
      code: 'SUMMER2026',
      type: 'PERCENT',
      valueAmount: 10,
      status: 'ACTIVE',
      startsAt: new Date('2026-04-01T00:00:00.000Z'),
      endsAt: new Date('2026-06-01T00:00:00.000Z'),
      usedCount: 0,
      usageLimit: 100,
    };
    const item = wishlistItemFixture({
      tourProgram: {
        ...wishlistItemFixture().tourProgram,
        instances: [
          {
            id: 'instance-1',
            expectedGuests: 20,
            bookings: [],
          },
        ],
        voucherTargets: [{ voucher }],
      },
    });
    const prisma = createPrismaMock({ items: [item] });

    const result = await sendWishlistReminderEmails(prisma, new Date('2026-05-01T08:00:00.000Z'));

    expect(result.sent).toBe(1);
    expect(prisma.emailOutbox.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        payloadJson: expect.objectContaining({
          voucherCode: 'SUMMER2026',
          discountValue: '10%',
        }),
      }),
    }));
  });

  it('does not send the same tour reminder twice in one day', async () => {
    const prisma = createPrismaMock({
      items: [wishlistItemFixture()],
      existingReminder: { id: 'email-existing' },
    });

    const result = await sendWishlistReminderEmails(prisma, new Date('2026-05-01T08:00:00.000Z'));

    expect(result).toEqual({ checked: 1, sent: 0, skipped: 1 });
    expect(prisma.emailOutbox.create).not.toHaveBeenCalled();
  });
});
