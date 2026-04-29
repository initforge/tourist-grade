import { describe, expect, it } from 'vitest';
import { buildPublicTour, isPubliclyBookableInstance } from './public-tours.js';

describe('public tour visibility rules', () => {
  const now = new Date('2026-04-29T12:00:00.000Z');

  it('hides open-sale tour instances after the booking deadline has passed', () => {
    expect(isPubliclyBookableInstance({
      status: 'DANG_MO_BAN',
      departureDate: new Date('2026-05-01T00:00:00.000Z'),
      bookingDeadlineAt: new Date('2026-04-29T00:00:00.000Z'),
    }, now)).toBe(false);
  });

  it('shows only open-sale future instances before the booking deadline', () => {
    expect(isPubliclyBookableInstance({
      status: 'DANG_MO_BAN',
      departureDate: new Date('2026-05-01T00:00:00.000Z'),
      bookingDeadlineAt: new Date('2026-04-30T00:00:00.000Z'),
    }, now)).toBe(true);
  });

  it('does not publish a tour program when all instances are expired for booking', () => {
    const program = {
      id: 'program-1',
      code: 'TP001',
      name: 'Tour hết hạn đặt',
      slug: 'tour-het-han-dat',
      description: '',
      departurePoint: 'Hà Nội',
      arrivalPoint: null,
      sightseeingSpots: ['Quảng Ninh'],
      durationDays: 3,
      durationNights: 2,
      transport: 'XE',
      tourType: 'QUANH_NAM',
      holidayLabel: null,
      bookingDeadline: 7,
      status: 'ACTIVE',
      itineraryJson: [],
      pricingConfigJson: {},
      publicContentJson: { id: 'T001' },
      createdById: 'user-1',
      updatedById: null,
      createdAt: now,
      updatedAt: now,
    };
    const instances = [
      {
        id: 'instance-1',
        code: 'TI001',
        programId: 'program-1',
        programNameSnapshot: 'Tour hết hạn đặt',
        departureDate: new Date('2026-05-01T00:00:00.000Z'),
        bookingDeadlineAt: new Date('2026-04-29T00:00:00.000Z'),
        status: 'DANG_MO_BAN',
        expectedGuests: 20,
        minParticipants: 10,
        priceAdult: 1000000,
        priceChild: 500000,
        priceInfant: 0,
        departurePoint: 'Hà Nội',
        arrivalPoint: null,
        sightseeingSpots: [],
        transport: 'XE',
        createdById: 'user-1',
        bookings: [],
      },
    ];

    expect(buildPublicTour(program as never, instances as never, [])).toBeNull();
  });
});
