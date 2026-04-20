import type { Booking } from '@entities/booking/data/bookings';

export type DailyRevenueRow = {
  date: string;
  bookingCount: number;
  revenue: number;
};

export function passengerCountLabel(booking: Booking) {
  const adults = booking.passengers.filter((passenger) => passenger.type === 'adult').length;
  const children = booking.passengers.filter((passenger) => passenger.type === 'child').length;
  const infants = booking.passengers.filter((passenger) => passenger.type === 'infant').length;
  return `${adults} Người lớn / ${children} Trẻ em / ${infants} Em bé`;
}

export function bookingNoteLabel(booking: Booking) {
  return booking.status === 'pending_cancel' || booking.status === 'cancelled'
    ? (booking.cancellationReason ?? '-')
    : (booking.contactInfo.note ?? '-');
}

export function buildDailyRevenueRows(bookings: Booking[]): DailyRevenueRow[] {
  const grouped = new Map<string, DailyRevenueRow>();

  for (const booking of bookings) {
    const date = booking.createdAt.slice(0, 10);
    const current = grouped.get(date) ?? { date, bookingCount: 0, revenue: 0 };
    grouped.set(date, {
      date,
      bookingCount: current.bookingCount + 1,
      revenue: current.revenue + booking.totalAmount,
    });
  }

  return [...grouped.values()].sort((left, right) => left.date.localeCompare(right.date));
}
