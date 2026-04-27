import type { Booking } from '@entities/booking/data/bookings';

export function isVietnameseNationality(value?: string) {
  const normalized = (value ?? '').trim().toLowerCase();
  return normalized === 'việt nam' || normalized === 'viet nam' || normalized === 'vietnam' || normalized === 'vn';
}

export function isBookingPendingConfirmation(booking: Booking) {
  return booking.status === 'pending';
}

export function isBookingPendingCancellation(booking: Booking) {
  return booking.status === 'pending_cancel';
}

export function isBookingConfirmedForOperations(booking: Booking) {
  return booking.status === 'confirmed' || booking.status === 'pending_cancel' || booking.status === 'completed';
}

export function isBookingFinanciallyRelevantForOperations(booking: Booking) {
  return isBookingConfirmedForOperations(booking) || booking.status === 'cancelled';
}

export function getRetainedAmountFromCancelledBooking(booking: Booking) {
  return Math.max(0, booking.totalAmount - (booking.refundAmount ?? 0));
}
