import type { Booking, BookingPassenger, TourInstance, TourProgram, TourReview, User } from '@prisma/client';
import {
  buildReviewSummary,
  calculateAvailableSeats,
  DEFAULT_SINGLE_ROOM_SURCHARGE,
  getTourRegion,
  resolveSingleRoomSurcharge,
} from './customer.js';

type InstanceWithBookings = TourInstance & {
  bookings: Array<Booking & { passengers: BookingPassenger[] }>;
};

type ReviewWithUser = TourReview & {
  user: Pick<User, 'fullName'> | null;
};

const PUBLICLY_VISIBLE_INSTANCE_STATUSES = new Set([
  'DANG_MO_BAN',
  'CHO_NHAN_DIEU_HANH',
  'CHO_DU_TOAN',
  'CHO_DUYET_DU_TOAN',
  'SAN_SANG_TRIEN_KHAI',
]);

function toPlainObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

function getBaseScheduleList(base: Record<string, unknown>) {
  return Array.isArray(base.departureSchedule) ? base.departureSchedule as Array<Record<string, unknown>> : [];
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildScheduleStatus(availableSeats: number, totalSlots: number) {
  if (availableSeats <= 0) {
    return 'full';
  }

  if (totalSlots > 0 && availableSeats / totalSlots <= 0.3) {
    return 'filling';
  }

  return 'open';
}

export function buildPublicTour(
  program: TourProgram,
  instances: InstanceWithBookings[],
  reviews: ReviewWithUser[],
) {
  const base = toPlainObject(program.publicContentJson);
  const baseSchedules = getBaseScheduleList(base);
  const visibleInstances = instances
    .filter((instance) => PUBLICLY_VISIBLE_INSTANCE_STATUSES.has(instance.status))
    .filter((instance) => instance.departureDate >= new Date(new Date().toDateString()))
    .sort((left, right) => left.departureDate.getTime() - right.departureDate.getTime());

  const departureSchedule = visibleInstances.map((instance) => {
    const dateKey = toDateKey(instance.departureDate);
    const matchedBaseSchedule = baseSchedules.find((item) => item.date === dateKey);
    const availableSeats = calculateAvailableSeats(instance, instance.bookings);
    return {
      id: typeof matchedBaseSchedule?.id === 'string' ? matchedBaseSchedule.id : `${program.code}-${instance.code}`,
      instanceCode: instance.code,
      programCode: program.code,
      date: dateKey,
      availableSeats,
      totalSlots: instance.expectedGuests,
      status: buildScheduleStatus(availableSeats, instance.expectedGuests),
      priceAdult: Number(instance.priceAdult),
      priceChild: Number(instance.priceChild),
      priceInfant: instance.priceInfant == null ? 0 : Number(instance.priceInfant),
      singleRoomSurcharge: resolveSingleRoomSurcharge(base, dateKey) ?? DEFAULT_SINGLE_ROOM_SURCHARGE,
      bookingDeadlineAt: instance.bookingDeadlineAt.toISOString(),
    };
  });

  const summary = buildReviewSummary(reviews);

  return {
    ...base,
    id: (base.id as string | undefined) ?? program.code,
    slug: (base.slug as string | undefined) ?? program.slug,
    title: (base.title as string | undefined) ?? program.name,
    description: (base.description as string | undefined) ?? program.description ?? '',
    departurePoint: (base.departurePoint as string | undefined) ?? program.departurePoint,
    arrivalPoint: (base.arrivalPoint as string | undefined) ?? program.arrivalPoint ?? undefined,
    sightseeingSpots: Array.isArray(base.sightseeingSpots) ? base.sightseeingSpots : program.sightseeingSpots,
    duration: {
      days: (base.duration as { days?: number } | undefined)?.days ?? program.durationDays,
      nights: (base.duration as { nights?: number } | undefined)?.nights ?? program.durationNights,
    },
    transport: (base.transport as string | undefined) ?? (program.transport === 'MAYBAY' ? 'maybay' : 'xe'),
    tourType: (base.tourType as string | undefined) ?? (program.tourType === 'MUA_LE' ? 'mua_le' : 'quanh_nam'),
    holiday: (base.holiday as string | undefined) ?? program.holidayLabel ?? undefined,
    bookingDeadline: program.bookingDeadline,
    availableSeats: departureSchedule.reduce((sum, row) => sum + row.availableSeats, 0),
    minParticipants: visibleInstances[0]?.minParticipants ?? 0,
    departureSchedule,
    rating: summary.rating,
    reviewCount: summary.reviewCount,
    regionKey: getTourRegion({
      name: program.name,
      description: program.description,
      departurePoint: program.departurePoint,
      arrivalPoint: program.arrivalPoint,
      sightseeingSpots: program.sightseeingSpots,
    }),
    reviews: reviews
      .slice()
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .map((review) => ({
        id: review.id,
        bookingId: review.bookingId,
        rating: review.rating,
        title: review.title ?? '',
        comment: review.comment,
        createdAt: review.createdAt.toISOString(),
        authorName: review.user?.fullName ?? 'Khach hang',
      })),
  };
}
