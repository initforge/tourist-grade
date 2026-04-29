import { describe, expect, it, vi } from 'vitest';
import { completeFinishedTourBookings, getTourCompletionDate, shouldMarkBookingCompleted } from './booking-lifecycle.js';

describe('booking lifecycle', () => {
  it('treats the last calendar day of the tour as not yet completed', () => {
    const departureDate = new Date('2026-04-25T00:00:00.000Z');

    expect(getTourCompletionDate(departureDate, 3)).toBe('2026-04-27');
    expect(shouldMarkBookingCompleted(departureDate, 3, new Date('2026-04-27T12:00:00.000Z'))).toBe(false);
    expect(shouldMarkBookingCompleted(departureDate, 3, new Date('2026-04-27T18:00:00.000Z'))).toBe(true);
  });

  it('marks only confirmed bookings whose tour end date has passed', async () => {
    const prisma = {
      booking: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'booking-past',
            tourInstance: {
              departureDate: new Date('2026-04-20T00:00:00.000Z'),
              program: { durationDays: 3 },
            },
          },
          {
            id: 'booking-active',
            tourInstance: {
              departureDate: new Date('2026-04-27T00:00:00.000Z'),
              program: { durationDays: 3 },
            },
          },
        ]),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const result = await completeFinishedTourBookings(prisma as never, new Date('2026-04-29T08:00:00.000Z'));

    expect(prisma.booking.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'CONFIRMED' },
    }));
    expect(prisma.booking.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['booking-past'] },
        status: 'CONFIRMED',
      },
      data: {
        status: 'COMPLETED',
      },
    });
    expect(result).toEqual({ count: 1 });
  });
});
