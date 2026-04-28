import type { Booking, Passenger } from '@entities/booking/data/bookings';
import { apiRequest } from './client';

export interface BookingContactPayload {
  name: string;
  phone: string;
  email: string;
  note?: string;
}

export interface CreateBookingPayload {
  tourSlug: string;
  scheduleId: string;
  contact: BookingContactPayload;
  passengers: Passenger[];
  roomCounts: {
    single: number;
    double: number;
    triple: number;
  };
  promoCode?: string;
  paymentRatio: 'deposit' | 'full';
  paymentMethod: 'bank' | 'card';
}

export interface PromoValidationPayload {
  tourSlug: string;
  scheduleId: string;
  promoCode: string;
  passengers: Passenger[];
}

export interface PaymentLinkResponse {
  success: boolean;
  paymentLink: {
    amount?: number;
    orderCode?: number;
    checkoutUrl?: string;
    qrCode?: string;
    paymentLinkId?: string;
  };
}

export async function createPublicBooking(payload: CreateBookingPayload, token?: string | null) {
  return apiRequest<{ success: boolean; booking: Booking }>('/bookings/public', {
    method: 'POST',
    token: token ?? undefined,
    body: JSON.stringify(payload),
  });
}

export async function validatePublicPromoCode(payload: PromoValidationPayload, token?: string | null) {
  return apiRequest<{ success: boolean; promo: { code: string | null; discountAmount: number; totalAmount: number } }>('/bookings/promo/validate', {
    method: 'POST',
    token: token ?? undefined,
    body: JSON.stringify(payload),
  });
}

export async function createBookingPaymentLink(bookingId: string, token?: string | null) {
  return apiRequest<PaymentLinkResponse>(`/payments/bookings/${bookingId}/payos-link`, {
    method: 'POST',
    token: token ?? undefined,
  });
}

export async function updateCheckoutBooking(
  bookingId: string,
  payload: Omit<CreateBookingPayload, 'tourSlug'>,
  token?: string | null,
) {
  return apiRequest<{ success: boolean; booking: Booking }>(`/bookings/${bookingId}/checkout`, {
    method: 'PUT',
    token: token ?? undefined,
    body: JSON.stringify(payload),
  });
}

export async function lookupBooking(bookingCode: string, contact: string) {
  const query = new URLSearchParams({
    bookingCode,
    contact,
  });

  return apiRequest<{ success: boolean; booking: Booking }>(`/bookings/lookup?${query.toString()}`);
}

export async function getBookingDetail(bookingId: string, token: string) {
  return apiRequest<{ success: boolean; booking: Booking }>(`/bookings/${bookingId}`, {
    token,
  });
}

export async function updateBooking(
  bookingId: string,
  payload: Record<string, unknown>,
  token?: string | null,
  options: { keepalive?: boolean } = {},
) {
  return apiRequest<{ success: boolean; booking: Booking }>(`/bookings/${bookingId}`, {
    method: 'PATCH',
    token: token ?? undefined,
    keepalive: options.keepalive,
    body: JSON.stringify(payload),
  });
}

export async function createPublicCancelRequest(
  bookingId: string,
  payload: {
    contact: string;
    cancellationReason?: string;
    bankInfo?: {
      accountNumber: string;
      bankName: string;
      accountHolder: string;
    };
  },
) {
  return apiRequest<{ success: boolean; booking: Booking }>(`/bookings/${bookingId}/cancel-request`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
