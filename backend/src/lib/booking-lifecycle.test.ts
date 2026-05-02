import { describe, expect, it, vi } from 'vitest';
import {
  completeFinishedTourBookings,
  advanceTourExecutionStatuses,
  getTourCompletionDate,
  markUnderfilledTourInstances,
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

  it('marks only underfilled estimate/coordinator instances, not open-sale ones', async () => {
    const prisma = {
      tourInstance: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'pending-sale-instance',
            status: 'CHO_DU_TOAN',
            bookings: [
              { status: 'CONFIRMED', passengers: Array.from({ length: 4 }, (_, index) => ({ id: `P${index}` })) },
              { status: 'PENDING', passengers: [{ id: 'P5' }] },
            ],
          },
          {
            id: 'underfilled-sale-instance',
            status: 'CHO_NHAN_DIEU_HANH',
            bookings: [
              { status: 'CONFIRMED', passengers: Array.from({ length: 4 }, (_, index) => ({ id: `Q${index}` })) },
              { status: 'CANCELLED', passengers: Array.from({ length: 8 }, (_, index) => ({ id: `C${index}` })) },
            ],
          },
          {
            id: 'underfilled-estimate-instance',
            status: 'CHO_DU_TOAN',
            bookings: [
              { status: 'CONFIRMED', passengers: Array.from({ length: 8 }, (_, index) => ({ id: `R${index}` })) },
              { status: 'CANCELLED', passengers: Array.from({ length: 4 }, (_, index) => ({ id: `D${index}` })) },
            ],
          },
        ]),
        updateMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
    };

    const result = await markUnderfilledTourInstances(prisma as never, new Date('2026-04-29T08:00:00.000Z'));

    expect(prisma.tourInstance.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['pending-sale-instance', 'underfilled-sale-instance', 'underfilled-estimate-instance'] },
        status: { in: ['CHO_NHAN_DIEU_HANH', 'CHO_DU_TOAN'] },
      },
      data: {
        status: 'CHUA_DU_KIEN',
      },
    });
    expect(result).toEqual({ count: 2 });
  });

  it('advances deployment and settlement statuses based on the tour calendar', async () => {
    const prisma = {
      tourInstance: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'deploying-instance',
            status: 'SAN_SANG_TRIEN_KHAI',
            departureDate: new Date('2026-05-01T00:00:00.000Z'),
            program: { durationDays: 3 },
          },
          {
            id: 'settlement-instance',
            status: 'DANG_TRIEN_KHAI',
            departureDate: new Date('2026-04-25T00:00:00.000Z'),
            program: { durationDays: 3 },
          },
        ]),
        updateMany: vi.fn()
          .mockResolvedValueOnce({ count: 1 })
          .mockResolvedValueOnce({ count: 1 }),
      },
    };

    const result = await advanceTourExecutionStatuses(prisma as never, new Date('2026-05-02T08:00:00.000Z'));

    expect(prisma.tourInstance.updateMany).toHaveBeenNthCalledWith(1, {
      where: {
        id: { in: ['deploying-instance'] },
        status: 'SAN_SANG_TRIEN_KHAI',
      },
      data: {
        status: 'DANG_TRIEN_KHAI',
      },
    });
    expect(prisma.tourInstance.updateMany).toHaveBeenNthCalledWith(2, {
      where: {
        id: { in: ['settlement-instance'] },
        status: 'DANG_TRIEN_KHAI',
      },
      data: {
        status: 'CHO_QUYET_TOAN',
      },
    });
    expect(result).toEqual({ deploying: 1, settlement: 1 });
  });
});
