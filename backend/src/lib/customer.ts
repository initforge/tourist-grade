import type {
  Booking,
  BookingPassenger,
  PaymentStatus,
  TourInstance,
  TourProgram,
  TourReview,
  Voucher,
} from '@prisma/client';

export const FINAL_PAYMENT_DEADLINE_DAYS = 7;
export const DEPOSIT_RATIO = 0.5;
export const DEFAULT_SINGLE_ROOM_SURCHARGE = 500000;
export const OVERDUE_DEPOSIT_CANCEL_REASON = 'Không thanh toán đầy đủ trước 7 ngày khởi hành';

const REGION_RULES = [
  { key: 'north', terms: ['hà nội', 'ha noi', 'hạ long', 'ha long', 'sa pa', 'sapa', 'lào cai', 'lao cai', 'ninh bình', 'ninh binh', 'quảng ninh', 'quang ninh'] },
  { key: 'central', terms: ['ninh thuận', 'ninh thuan', 'đà nẵng', 'da nang', 'huế', 'hue', 'hội an', 'hoi an', 'quảng nam', 'quang nam', 'vĩnh hy', 'vinh hy'] },
  { key: 'south', terms: ['hồ chí minh', 'ho chi minh', 'phú quốc', 'phu quoc', 'cần thơ', 'can tho', 'vũng tàu', 'vung tau'] },
] as const;

type PassengerInput = {
  type: 'adult' | 'child' | 'infant';
  dob?: string;
  nationality?: string;
  cccd?: string;
};

function stripTime(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getBookingCreatedExpiryAt(createdAt: Date) {
  return new Date(createdAt.getTime() + 15 * 60 * 1000);
}

export function getFinalPaymentDueAt(tourDate: Date) {
  return addDays(stripTime(tourDate), -FINAL_PAYMENT_DEADLINE_DAYS);
}

export function isWithinFinalPaymentWindow(tourDate: Date, now = new Date()) {
  return stripTime(now) >= getFinalPaymentDueAt(tourDate);
}

export function calculateAgeAtDate(dateOfBirth: string | Date | null | undefined, referenceDate: Date) {
  if (!dateOfBirth) {
    return null;
  }

  const birthDate = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const birthdayHasPassed =
    referenceDate.getMonth() > birthDate.getMonth()
    || (referenceDate.getMonth() === birthDate.getMonth() && referenceDate.getDate() >= birthDate.getDate());

  if (!birthdayHasPassed) {
    age -= 1;
  }

  return age;
}

export function validatePassengerAge(passenger: PassengerInput, departureDate: Date) {
  const age = calculateAgeAtDate(passenger.dob, departureDate);
  if (age == null) {
    return null;
  }

  if (passenger.type === 'adult' && age < 12) {
    return 'Tuổi không phù hợp';
  }

  if (passenger.type === 'child' && (age < 2 || age > 11)) {
    return 'Tuổi không phù hợp';
  }

  if (passenger.type === 'infant' && age >= 2) {
    return 'Tuổi không phù hợp';
  }

  return null;
}

export function isVietnameseNationality(value?: string | null) {
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === '' || normalized === 'việt nam' || normalized === 'viet nam' || normalized === 'vietnam';
}

export function requiresTwelveDigitDocument(passenger: PassengerInput) {
  return isVietnameseNationality(passenger.nationality);
}

export function validatePassengerDocument(passenger: PassengerInput) {
  if (!passenger.cccd) {
    return null;
  }

  if (!requiresTwelveDigitDocument(passenger)) {
    return null;
  }

  return /^\d{12}$/.test(passenger.cccd.trim()) ? null : 'CCCD/GKS phải gồm 12 chữ số';
}

export function deriveRegionKey(text: string) {
  const normalized = text.toLowerCase();
  return REGION_RULES.find((rule) => rule.terms.some((term) => normalized.includes(term)))?.key ?? 'all';
}

export function getTourRegion(program: Pick<TourProgram, 'name' | 'description' | 'departurePoint' | 'arrivalPoint'> & { sightseeingSpots: unknown }) {
  const spots = Array.isArray(program.sightseeingSpots) ? program.sightseeingSpots.join(' ') : '';
  const haystack = [program.name, program.description ?? '', program.departurePoint, program.arrivalPoint ?? '', spots].join(' ');
  return deriveRegionKey(haystack);
}

export function calculateVoucherDiscount(voucher: Pick<Voucher, 'type' | 'valueAmount'>, subtotal: number) {
  if (voucher.type === 'PERCENT') {
    return Math.min(Math.round(subtotal * (Number(voucher.valueAmount) / 100)), subtotal);
  }

  return Math.min(Number(voucher.valueAmount), subtotal);
}

export function countBookedGuests(bookings: Array<Booking & { passengers: BookingPassenger[] }>) {
  return bookings
    .filter((booking) => booking.status !== 'CANCELLED')
    .reduce((sum, booking) => sum + booking.passengers.length, 0);
}

export function calculateAvailableSeats(instance: Pick<TourInstance, 'expectedGuests'>, bookings: Array<Booking & { passengers: BookingPassenger[] }>) {
  return Math.max(instance.expectedGuests - countBookedGuests(bookings), 0);
}

export function resolveSingleRoomSurcharge(publicContent: Record<string, unknown> | null | undefined, departureDate: string) {
  const scheduleList = publicContent?.['departureSchedule'];
  if (Array.isArray(scheduleList)) {
    const matched = scheduleList.find((item) => {
      if (!item || typeof item !== 'object') {
        return false;
      }
      const value = item as { date?: unknown; singleRoomSurcharge?: unknown };
      return value.date === departureDate && typeof value.singleRoomSurcharge === 'number';
    }) as { singleRoomSurcharge?: number } | undefined;

    if (typeof matched?.singleRoomSurcharge === 'number') {
      return matched.singleRoomSurcharge;
    }
  }

  return DEFAULT_SINGLE_ROOM_SURCHARGE;
}

export function buildReviewSummary(reviews: Array<Pick<TourReview, 'rating'>>) {
  if (reviews.length === 0) {
    return { rating: 0, reviewCount: 0 };
  }

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return {
    rating: Math.round((total / reviews.length) * 10) / 10,
    reviewCount: reviews.length,
  };
}

export function normalizePaymentStatusAfterPartial(totalAmount: number, paidAmount: number): PaymentStatus {
  if (paidAmount <= 0) {
    return 'UNPAID';
  }

  return paidAmount >= totalAmount ? 'PAID' : 'PARTIAL';
}
