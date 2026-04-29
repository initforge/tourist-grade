export interface Passenger {
  type: 'adult' | 'child' | 'infant';
  name: string;
  dob: string;
  gender: 'male' | 'female';
  cccd?: string;
  nationality?: string;
  singleRoomSupplement?: number;
}

export interface PaymentTransaction {
  id: string;
  amount: number;
  method: 'vnpay' | 'stripe' | 'payos';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paidAt: string;
  transactionRef?: string;
  orderCode?: string;
}

export interface BookingReview {
  id: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  bookingCode: string;
  tourId: string;
  programCode?: string;
  instanceCode?: string;
  tourName: string;
  tourDate: string;
  tourDuration: string;
  userId?: string;
  status: 'pending' | 'pending_cancel' | 'confirmed' | 'completed' | 'cancelled';
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
  paymentWindowExpiresAt?: string;
  finalPaymentDueAt?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  roomCounts?: {
    single: number;
    double: number;
    triple: number;
  };
  confirmedBy?: string;
  confirmedAt?: string;
  cancelledConfirmedBy?: string;
  cancelledConfirmedAt?: string;
  refundedBy?: string;
  refundedAt?: string;
  refundAmount?: number;
  review?: BookingReview;
}
