import { describe, expect, it, vi } from 'vitest';
import {
  completeFinishedTourBookings,
  getTourCompletionDate,
  promoteReadyTourInstances,
  shouldMarkBookingCompleted,
} from './booking-lifecycle.js';

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

  it('moves only deadline-passed tours with enough resolved confirmed guests to operations intake', async () => {
    const prisma = {
      tourInstance: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'ready-instance',
            bookings: [
              {
                status: 'CONFIRMED',
                passengers: Array.from({ length: 10 }, (_, index) => ({ id: `P${index + 1}` })),
              },
            ],
          },
          {
            id: 'pending-instance',
            bookings: [
              {
                status: 'CONFIRMED',
                passengers: Array.from({ length: 10 }, (_, index) => ({ id: `Q${index + 1}` })),
              },
              { status: 'PENDING', passengers: [{ id: 'Q11' }] },
            ],
          },
          {
            id: 'insufficient-instance',
            bookings: [
              { status: 'CONFIRMED', passengers: [{ id: 'P5' }, { id: 'P6' }] },
            ],
          },
        ]),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const result = await promoteReadyTourInstances(prisma as never, new Date('2026-04-29T08:00:00.000Z'));

    expect(prisma.tourInstance.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        status: { in: ['DANG_MO_BAN'] },
        bookingDeadlineAt: { lte: expect.any(Date) },
      }),
    }));
    expect(prisma.tourInstance.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['ready-instance'] },
        status: { in: ['DANG_MO_BAN'] },
      },
      data: {
        status: 'CHO_NHAN_DIEU_HANH',
      },
    });
    expect(result).toEqual({ count: 1 });
  });
});
