import type { Booking } from '@entities/booking/data/bookings';

export const BOOKING_STATUS_LABEL: Record<Booking['status'], string> = {
  booked: 'Đã đặt',
  pending: 'Chờ xác nhận',
  pending_cancel: 'Chờ xác nhận hủy',
  confirmed: 'Đã xác nhận',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

export const PAYMENT_STATUS_LABEL: Record<Booking['paymentStatus'], string> = {
  unpaid: 'Chưa thanh toán',
  partial: 'Thanh toán một phần',
  paid: 'Đã thanh toán',
  refunded: 'Đã hoàn tiền',
};

export const PAYMENT_METHOD_LABEL: Record<Booking['paymentMethod'], string> = {
  vnpay: 'VNPAY',
  stripe: 'Stripe',
  payos: 'PayOS',
};

export function formatCurrency(amount: number) {
  return `${amount.toLocaleString('vi-VN')}đ`;
}

export function getRefundAmountEstimate(booking: Booking) {
  const daysLeft = Math.ceil((new Date(booking.tourDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (daysLeft >= 30) return booking.paidAmount;
  if (daysLeft >= 15) return Math.round(booking.paidAmount * 0.7);
  if (daysLeft >= 7) return Math.round(booking.paidAmount * 0.5);
  if (daysLeft >= 3) return Math.round(booking.paidAmount * 0.2);
  return 0;
}

export function canCustomerCancel(booking: Booking) {
  return ['booked', 'pending', 'confirmed'].includes(booking.status) && new Date(booking.tourDate) > new Date();
}

export function canCustomerPay(booking: Booking) {
  return canCustomerCancel(booking) && ['unpaid', 'partial'].includes(booking.paymentStatus);
}
