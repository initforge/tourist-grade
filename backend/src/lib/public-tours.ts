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
]);

export function isPubliclyBookableInstance(instance: Pick<TourInstance, 'status' | 'departureDate' | 'bookingDeadlineAt'>, now = new Date()) {
  const today = new Date(now.toDateString());
  return PUBLICLY_VISIBLE_INSTANCE_STATUSES.has(instance.status)
    && instance.departureDate >= today
    && instance.bookingDeadlineAt > now;
}

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

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getPricingConfig(program: TourProgram) {
  const payload = toPlainObject(program.pricingConfigJson);
  return toPlainObject(payload.pricingConfig ?? payload);
}

function getFallbackPrice(program: TourProgram, instances: InstanceWithBookings[]) {
  const firstInstance = instances
    .slice()
    .sort((left, right) => left.departureDate.getTime() - right.departureDate.getTime())[0];
  const pricingConfig = getPricingConfig(program);
  const adult = firstInstance ? Number(firstInstance.priceAdult) : toNumber(pricingConfig.sellPriceAdult);
  const child = firstInstance ? Number(firstInstance.priceChild) : toNumber(pricingConfig.sellPriceChild, Math.round(adult * 0.75));
  const infant = firstInstance?.priceInfant == null ? toNumber(pricingConfig.sellPriceInfant, 0) : Number(firstInstance.priceInfant);
  return { adult, child, infant };
}

function buildFallbackItinerary(program: TourProgram) {
  const itinerary = Array.isArray(program.itineraryJson)
    ? program.itineraryJson as Array<{
      day?: number;
      title?: string;
      description?: string;
      meals?: ('breakfast' | 'lunch' | 'dinner')[];
      activities?: string[];
    }>
    : [];

  return itinerary.map((day, index) => ({
    day: day.day ?? index + 1,
    title: day.title ?? `Ngày ${index + 1}`,
    description: day.description ?? '',
    activities: Array.isArray(day.activities) ? day.activities : [],
    meals: Array.isArray(day.meals) ? day.meals : [],
  }));
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
  const now = new Date();
  const visibleInstances = instances
    .filter((instance) => isPubliclyBookableInstance(instance, now))
    .sort((left, right) => left.departureDate.getTime() - right.departureDate.getTime());

  if (visibleInstances.length === 0) {
    return null;
  }

  const fallbackPrice = getFallbackPrice(program, visibleInstances);
  const baseGallery = Array.isArray(base.gallery) ? base.gallery.filter((item): item is string => typeof item === 'string' && item.length > 0) : [];
  const baseImage = typeof base.image === 'string' ? base.image : '';

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
    highlights: Array.isArray(base.highlights) ? base.highlights : [],
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
    price: toPlainObject(base.price).adult == null ? fallbackPrice : {
      adult: toNumber(toPlainObject(base.price).adult, fallbackPrice.adult),
      child: toNumber(toPlainObject(base.price).child, fallbackPrice.child),
      infant: toNumber(toPlainObject(base.price).infant, fallbackPrice.infant),
    },
    originalPrice: typeof base.originalPrice === 'number' ? base.originalPrice : undefined,
    image: baseImage || baseGallery[0] || '',
    gallery: baseGallery,
    startDate: departureSchedule[0]?.date ?? '',
    availableSeats: departureSchedule.reduce((sum, row) => sum + row.availableSeats, 0),
    minParticipants: visibleInstances[0]?.minParticipants ?? 0,
    status: 'published',
    category: (base.category as 'domestic' | 'international' | undefined) ?? 'domestic',
    itinerary: Array.isArray(base.itinerary) ? base.itinerary : buildFallbackItinerary(program),
    inclusions: Array.isArray(base.inclusions) ? base.inclusions : [],
    exclusions: Array.isArray(base.exclusions) ? base.exclusions : [],
    childPolicy: (base.childPolicy as string | undefined) ?? 'Trẻ em tính theo chính sách giá tại thời điểm đặt tour.',
    cancellationPolicy: Array.isArray(base.cancellationPolicy) ? base.cancellationPolicy : [],
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
        authorName: review.user?.fullName ?? 'Khách hàng',
      })),
  };
}
