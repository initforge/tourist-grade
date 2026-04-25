export interface Passenger {
  type: 'adult' | 'child' | 'infant';
  name: string;
  dob: string;
  gender: 'male' | 'female';
  cccd?: string;
  nationality?: string;
  /** Ph? thu phòng don cho ngu?i l?n (VNÐ) */
  singleRoomSupplement?: number;
}

export interface PaymentTransaction {
  id: string;
  amount: number;
  method: 'vnpay' | 'stripe' | 'payos';
  status: 'pending' | 'completed' | 'failed';
  paidAt: string;
  transactionRef?: string;
  orderCode?: string;
}

export interface Booking {
  id: string;
  bookingCode: string;
  tourId: string;
  tourName: string;
  tourDate: string;
  tourDuration: string;
  userId?: string;
  /** pending | pending_cancel | booked | confirmed | completed | cancelled */
  status: 'booked' | 'pending' | 'pending_cancel' | 'confirmed' | 'completed' | 'cancelled';
  refundStatus: 'none' | 'pending' | 'refunded' | 'not_required';
  refundBillUrl?: string;
  passengers: Passenger[];
  contactInfo: {
    name: string;
    email: string;
    phone: string;
    note?: string;
  };
  bankInfo?: {
    accountNumber: string;
    bankName: string;
    accountHolder: string;
  };
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: 'vnpay' | 'stripe' | 'payos';
  paymentType: 'online' | 'offline';
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'refunded';
  paymentTransactions: PaymentTransaction[];
  promoCode?: string;
  discountAmount?: number;
  createdAt: string;
  /** For pending_cancel: the cancellation reason submitted by customer */
  cancellationReason?: string;
  cancelledAt?: string;

  /** S? lu?ng phòng (don / dôi / ba) */
  roomCounts?: {
    single: number;
    double: number;
    triple: number;
  };

  /** Ngu?i xác nh?n don d?t (status: booked ? confirmed) */
  confirmedBy?: string;
  confirmedAt?: string;

  /** Ngu?i xác nh?n yêu c?u h?y (status: pending_cancel ? cancelled) */
  cancelledConfirmedBy?: string;
  cancelledConfirmedAt?: string;

  /** Ngu?i hoàn ti?n */
  refundedBy?: string;
  refundedAt?: string;

  /** Ngu?i ch?nh s?a bill hoàn ti?n (sau khi dã hoàn) */
  refundBillEditedBy?: string;
  refundBillEditedAt?: string;

  /** S? ti?n hoàn */
  refundAmount?: number;
}
