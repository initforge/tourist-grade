export interface Passenger {
  type: 'adult' | 'child' | 'infant';
  name: string;
  dob: string;
  gender: 'male' | 'female';
  cccd?: string;
  nationality?: string;
  /** Phụ thu phòng đơn cho người lớn (VNĐ) */
  singleRoomSupplement?: number;
}

export interface PaymentTransaction {
  id: string;
  amount: number;
  method: 'vnpay' | 'stripe';
  status: 'pending' | 'completed' | 'failed';
  paidAt: string;
  transactionRef?: string;
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
  paymentMethod: 'vnpay' | 'stripe';
  paymentType: 'online' | 'offline';
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'refunded';
  paymentTransactions: PaymentTransaction[];
  promoCode?: string;
  discountAmount?: number;
  createdAt: string;
  /** For pending_cancel: the cancellation reason submitted by customer */
  cancellationReason?: string;
  cancelledAt?: string;

  /** Số lượng phòng (đơn / đôi / ba) */
  roomCounts?: {
    single: number;
    double: number;
    triple: number;
  };

  /** Người xác nhận đơn đặt (status: booked → confirmed) */
  confirmedBy?: string;
  confirmedAt?: string;

  /** Người xác nhận yêu cầu hủy (status: pending_cancel → cancelled) */
  cancelledConfirmedBy?: string;
  cancelledConfirmedAt?: string;

  /** Người hoàn tiền */
  refundedBy?: string;
  refundedAt?: string;

  /** Người chỉnh sửa bill hoàn tiền (sau khi đã hoàn) */
  refundBillEditedBy?: string;
  refundBillEditedAt?: string;

  /** Số tiền hoàn */
  refundAmount?: number;
}

export const mockBookings: Booking[] = [
  // ── Cần xác nhận đơn đặt (pending) ─────────────────────────────────────────
  {
    id: 'B003',
    bookingCode: 'BK-394821',
    tourId: 'T002',
    tourName: 'Amanoi Ninh Thuận',
    tourDate: '2026-10-15',
    tourDuration: '4N3Đ',
    userId: 'U005',
    status: 'pending',       // pending = Cần xác nhận đơn đặt
    refundStatus: 'none',
    passengers: [
      { type: 'adult', name: 'Lê Văn C', dob: '1990-03-15', gender: 'male', cccd: '001090034567', nationality: 'Việt Nam', singleRoomSupplement: 500000 },
      { type: 'adult', name: 'Phạm Thị D', dob: '1992-07-22', gender: 'female', cccd: '001092078901', nationality: 'Việt Nam' },
      { type: 'child', name: 'Lê Minh E', dob: '2018-01-10', gender: 'male' }
    ],
    contactInfo: {
      name: 'Lê Văn C',
      email: 'levanc@gmail.com',
      phone: '0912 345 678'
    },
    totalAmount: 56000000,
    paidAmount: 0,
    remainingAmount: 56000000,
    paymentMethod: 'vnpay',
    paymentType: 'online',
    paymentStatus: 'unpaid',
    paymentTransactions: [],
    createdAt: '2026-03-24T14:20:00Z'
  },
  {
    id: 'B010',
    bookingCode: 'BK-509182',
    tourId: 'T003',
    tourName: 'Mùa Thu Kyoto & Osaka',
    tourDate: '2026-12-10',
    tourDuration: '6N5Đ',
    userId: 'U005',
    status: 'pending',       // pending = Cần xác nhận đơn đặt (partial payment)
    refundStatus: 'none',
    passengers: [
      { type: 'adult', name: 'Cao Đức S', dob: '1989-11-02', gender: 'male', cccd: '001089011234', nationality: 'Việt Nam', singleRoomSupplement: 800000 }
    ],
    contactInfo: {
      name: 'Cao Đức S',
      email: 'caoducs@gmail.com',
      phone: '0955 222 444'
    },
    totalAmount: 32000000,
    paidAmount: 16000000,
    remainingAmount: 16000000,
    paymentMethod: 'stripe',
    paymentType: 'online',
    paymentStatus: 'partial',
    paymentTransactions: [
      { id: 'TX010-1', amount: 16000000, method: 'stripe', status: 'completed', paidAt: '2026-03-26T20:40:00Z', transactionRef: 'STR17000002' }
    ],
    roomCounts: { single: 1, double: 0, triple: 0 },
    createdAt: '2026-03-26T20:30:00Z'
  },

  // ── Cần xác nhận hủy (pending_cancel) ───────────────────────────────────────
  {
    id: 'B002',
    bookingCode: 'BK-102938',
    tourId: 'T003',
    tourName: 'Mùa Thu Kyoto & Osaka',
    tourDate: '2026-10-15',
    tourDuration: '6N5Đ',
    userId: 'U005',
    status: 'pending_cancel', // pending_cancel = Cần xác nhận hủy
    refundStatus: 'pending',  // đang chờ hoàn tiền
    passengers: [
      { type: 'adult', name: 'Nguyễn Văn A', dob: '1985-05-12', gender: 'male', cccd: '001085012345', nationality: 'Việt Nam' }
    ],
    contactInfo: {
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@gmail.com',
      phone: '0988 888 888'
    },
    bankInfo: {
      accountNumber: '1234567890',
      bankName: 'Vietcombank',
      accountHolder: 'NGUYỄN VĂN A'
    },
    totalAmount: 32000000,
    paidAmount: 32000000,
    remainingAmount: 0,
    paymentMethod: 'stripe',
    paymentType: 'online',
    paymentStatus: 'paid',
    paymentTransactions: [
      { id: 'TX002-1', amount: 32000000, method: 'stripe', status: 'completed', paidAt: '2026-03-26T08:20:00Z', transactionRef: 'STR17000001' }
    ],
    cancellationReason: 'Thay đổi kế hoạch công tác',
    cancelledAt: '2026-04-05T10:00:00Z',
    cancelledConfirmedBy: 'Nhân Viên Kinh Doanh',
    cancelledConfirmedAt: '2026-04-05T10:30:00Z',
    refundAmount: 25600000,
    createdAt: '2026-03-26T08:15:00Z'
  },

  // ── Đã xác nhận (confirmed) ──────────────────────────────────────────────────
  {
    id: 'B001',
    bookingCode: 'BK-582910',
    tourId: 'T001',
    tourName: 'Hạ Long - Kỳ quan Thế giới',
    tourDate: '2026-10-12',
    tourDuration: '3N2Đ',
    userId: 'U005',
    status: 'confirmed',
    refundStatus: 'none',
    passengers: [
      { type: 'adult', name: 'Nguyễn Văn A', dob: '1985-05-12', gender: 'male', cccd: '001085012345', nationality: 'Việt Nam' },
      { type: 'adult', name: 'Trần Thị B', dob: '1987-08-20', gender: 'female', cccd: '001087067890', nationality: 'Việt Nam' }
    ],
    roomCounts: { single: 1, double: 0, triple: 0 },
    contactInfo: {
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@gmail.com',
      phone: '0988 888 888',
      note: 'Dị ứng hải sản nhẹ'
    },
    totalAmount: 9000000,
    paidAmount: 9000000,
    remainingAmount: 0,
    paymentMethod: 'vnpay',
    paymentType: 'online',
    paymentStatus: 'paid',
    paymentTransactions: [
      { id: 'TX001-1', amount: 9000000, method: 'vnpay', status: 'completed', paidAt: '2026-03-25T10:45:00Z', transactionRef: 'VNP17000001' }
    ],
    confirmedBy: 'Nhân Viên Kinh Doanh',
    confirmedAt: '2026-03-25T11:00:00Z',
    createdAt: '2026-03-25T10:30:00Z'
  },
  {
    id: 'B009',
    bookingCode: 'BK-401928',
    tourId: 'T003',
    tourName: 'Mùa Thu Kyoto & Osaka',
    tourDate: '2026-10-15',
    tourDuration: '6N5Đ',
    userId: 'U005',
    status: 'confirmed',     // partial payment (50%)
    refundStatus: 'none',
    passengers: [
      { type: 'adult', name: 'Vương Minh Q', dob: '1991-03-18', gender: 'male', cccd: '001091034567', nationality: 'Việt Nam', singleRoomSupplement: 600000 },
      { type: 'adult', name: 'Lý Thị R', dob: '1993-07-25', gender: 'female', cccd: '001093078901', nationality: 'Việt Nam' }
    ],
    contactInfo: {
      name: 'Vương Minh Q',
      email: 'vuongminhq@gmail.com',
      phone: '0922 111 333'
    },
    totalAmount: 64000000,
    paidAmount: 32000000,
    remainingAmount: 32000000,
    paymentMethod: 'vnpay',
    paymentType: 'online',
    paymentStatus: 'partial',
    paymentTransactions: [
      { id: 'TX009-1', amount: 32000000, method: 'vnpay', status: 'completed', paidAt: '2026-03-26T18:10:00Z', transactionRef: 'VNP17000006' }
    ],
    promoCode: 'TRAVELA50',
    discountAmount: 0,
    createdAt: '2026-03-26T18:00:00Z'
  },

  // ── Đã đặt (booked) — NV đã xác nhận, chưa confirmed ──────────────────────
  {
    id: 'B011',
    bookingCode: 'BK-773420',
    tourId: 'T001',
    tourName: 'Hạ Long - Kỳ quan Thế giới',
    tourDate: '2026-10-18',
    tourDuration: '3N2Đ',
    userId: 'U005',
    status: 'booked',
    refundStatus: 'none',
    passengers: [
      { type: 'adult', name: 'Võ Thanh P', dob: '1986-04-20', gender: 'male', cccd: '001086045678', nationality: 'Việt Nam', singleRoomSupplement: 500000 },
      { type: 'adult', name: 'Trần Mai Q', dob: '1988-10-05', gender: 'female', cccd: '001088078901', nationality: 'Việt Nam' }
    ],
    contactInfo: {
      name: 'Võ Thanh P',
      email: 'vothanhp@gmail.com',
      phone: '0933 111 222'
    },
    totalAmount: 9000000,
    paidAmount: 9000000,
    remainingAmount: 0,
    paymentMethod: 'vnpay',
    paymentType: 'online',
    paymentStatus: 'paid',
    paymentTransactions: [
      { id: 'TX011-1', amount: 9000000, method: 'vnpay', status: 'completed', paidAt: '2026-04-08T09:00:00Z', transactionRef: 'VNP17000010' }
    ],
    roomCounts: { single: 1, double: 0, triple: 0 },
    confirmedBy: 'Nhân Viên Kinh Doanh',
    confirmedAt: '2026-04-08T09:15:00Z',
    createdAt: '2026-04-08T08:50:00Z'
  },

  // ── Hoàn thành (completed) — paymentStatus = paid (100%) ─────────────────────
  {
    id: 'B004',
    bookingCode: 'BK-847291',
    tourId: 'T001',
    tourName: 'Khám Phá Vịnh Hạ Long',
    tourDate: '2026-04-10',
    tourDuration: '3N2Đ',
    userId: 'U005',
    status: 'completed',
    refundStatus: 'none',
    passengers: [
      { type: 'adult', name: 'Hoàng Văn F', dob: '1988-11-05', gender: 'male', cccd: '001088056789', nationality: 'Việt Nam' },
      { type: 'adult', name: 'Vũ Thị G', dob: '1990-09-18', gender: 'female', cccd: '001090098765', nationality: 'Việt Nam' }
    ],
    contactInfo: {
      name: 'Hoàng Văn F',
      email: 'hoangvanf@gmail.com',
      phone: '0977 654 321'
    },
    totalAmount: 9000000,
    paidAmount: 9000000,
    remainingAmount: 0,
    paymentMethod: 'vnpay',
    paymentType: 'online',
    paymentStatus: 'paid',
    paymentTransactions: [
      { id: 'TX004-1', amount: 4500000, method: 'vnpay', status: 'completed', paidAt: '2026-03-20T09:50:00Z', transactionRef: 'VNP17000002' },
      { id: 'TX004-2', amount: 4500000, method: 'vnpay', status: 'completed', paidAt: '2026-04-09T10:00:00Z', transactionRef: 'VNP17000003' }
    ],
    createdAt: '2026-03-20T09:45:00Z'
  },
  {
    id: 'B008',
    bookingCode: 'BK-291045',
    tourId: 'T002',
    tourName: 'Amanoi Ninh Thuận',
    tourDate: '2026-11-10',
    tourDuration: '4N3Đ',
    userId: 'U005',
    status: 'completed',
    refundStatus: 'none',
    passengers: [
      { type: 'adult', name: 'Phan Văn M', dob: '1982-09-03', gender: 'male', cccd: '001082090123', nationality: 'Việt Nam' },
      { type: 'adult', name: 'Ngô Thị N', dob: '1984-11-17', gender: 'female', cccd: '001084011234', nationality: 'Việt Nam' },
      { type: 'child', name: 'Phan Minh O', dob: '2016-05-25', gender: 'male' },
      { type: 'infant', name: 'Phan Bảo P', dob: '2024-08-12', gender: 'female' }
    ],
    contactInfo: {
      name: 'Phan Văn M',
      email: 'phanvanm@gmail.com',
      phone: '0901 234 567',
      note: 'Yêu cầu phòng view biển'
    },
    totalAmount: 56400000,
    paidAmount: 56400000,
    remainingAmount: 0,
    paymentMethod: 'vnpay',
    paymentType: 'online',
    paymentStatus: 'paid',
    paymentTransactions: [
      { id: 'TX008-1', amount: 56400000, method: 'vnpay', status: 'completed', paidAt: '2026-03-15T07:10:00Z', transactionRef: 'VNP17000005' }
    ],
    createdAt: '2026-03-15T07:00:00Z'
  },

  // ── Đã hủy (cancelled) ───────────────────────────────────────────────────────
  {
    id: 'B005',
    bookingCode: 'BK-192837',
    tourId: 'T001',
    tourName: 'Khám Phá Vịnh Hạ Long',
    tourDate: '2026-11-20',
    tourDuration: '3N2Đ',
    userId: 'U005',
    status: 'cancelled',
    refundStatus: 'pending',   // Chưa hoàn
    passengers: [
      { type: 'adult', name: 'Đỗ Thị H', dob: '1995-04-30', gender: 'female', cccd: '001095045678', nationality: 'Việt Nam' },
      { type: 'adult', name: 'Bùi Văn I', dob: '1993-12-08', gender: 'male', cccd: '001093012890', nationality: 'Việt Nam' }
    ],
    contactInfo: {
      name: 'Đỗ Thị H',
      email: 'dothih@gmail.com',
      phone: '0933 456 789'
    },
    bankInfo: {
      accountNumber: '1234567890',
      bankName: 'Vietcombank',
      accountHolder: 'ĐỖ THỊ H'
    },
    totalAmount: 9000000,
    paidAmount: 9000000,
    remainingAmount: 0,
    paymentMethod: 'vnpay',
    paymentType: 'online',
    paymentStatus: 'paid',
    paymentTransactions: [
      { id: 'TX005-1', amount: 9000000, method: 'vnpay', status: 'completed', paidAt: '2026-03-22T16:40:00Z', transactionRef: 'VNP17000004' }
    ],
    cancellationReason: 'Danh sách hành khách không đủ điều kiện',
    cancelledAt: '2026-03-28T10:00:00Z',
    cancelledConfirmedBy: 'Nhân Viên Kinh Doanh',
    cancelledConfirmedAt: '2026-03-28T11:00:00Z',
    refundAmount: 6300000,
    createdAt: '2026-03-22T16:30:00Z'
  },
  {
    id: 'B006',
    bookingCode: 'BK-564738',
    tourId: 'T003',
    tourName: 'Mùa Thu Kyoto & Osaka',
    tourDate: '2026-12-01',
    tourDuration: '6N5Đ',
    userId: 'U005',
    status: 'cancelled',
    refundStatus: 'refunded',  // Đã hoàn
    refundBillUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
    passengers: [
      { type: 'adult', name: 'Trịnh Văn K', dob: '1985-06-14', gender: 'male', cccd: '001085067890', nationality: 'Việt Nam' }
    ],
    contactInfo: {
      name: 'Trịnh Văn K',
      email: 'trinhvank@gmail.com',
      phone: '0945 678 901'
    },
    bankInfo: {
      accountNumber: '9876543210',
      bankName: 'Techcombank',
      accountHolder: 'TRỊNH VĂN K'
    },
    totalAmount: 32000000,
    paidAmount: 32000000,
    remainingAmount: 0,
    paymentMethod: 'stripe',
    paymentType: 'online',
    paymentStatus: 'refunded',
    paymentTransactions: [
      { id: 'TX006-1', amount: 32000000, method: 'stripe', status: 'completed', paidAt: '2026-03-18T11:10:00Z', transactionRef: 'STR17000003' }
    ],
    cancellationReason: 'Sức khỏe không cho phép',
    cancelledAt: '2026-03-25T14:00:00Z',
    cancelledConfirmedBy: 'Nhân Viên Kinh Doanh',
    cancelledConfirmedAt: '2026-03-25T14:15:00Z',
    refundedBy: 'Nhân Viên Kinh Doanh',
    refundedAt: '2026-03-26T09:00:00Z',
    refundBillEditedBy: 'Nhân Viên Kinh Doanh',
    refundBillEditedAt: '2026-03-26T10:30:00Z',
    refundAmount: 25600000,
    createdAt: '2026-03-18T11:00:00Z'
  },
  {
    id: 'B007',
    bookingCode: 'BK-738291',
    tourId: 'T001',
    tourName: 'Khám Phá Vịnh Hạ Long',
    tourDate: '2026-10-20',
    tourDuration: '3N2Đ',
    userId: 'U005',
    status: 'cancelled',
    refundStatus: 'not_required', // Không cần hoàn (chưa thanh toán)
    passengers: [
      { type: 'adult', name: 'Mai Thị L', dob: '1998-02-28', gender: 'female', cccd: '001098023456', nationality: 'Việt Nam' }
    ],
    contactInfo: {
      name: 'Mai Thị L',
      email: 'maithil@gmail.com',
      phone: '0966 789 012'
    },
    totalAmount: 4500000,
    paidAmount: 0,
    remainingAmount: 0,
    paymentMethod: 'vnpay',
    paymentType: 'online',
    paymentStatus: 'unpaid',
    paymentTransactions: [],
    cancellationReason: 'Hủy trước khi thanh toán',
    cancelledAt: '2026-03-23T09:00:00Z',
    cancelledConfirmedBy: 'Nhân Viên Kinh Doanh',
    cancelledConfirmedAt: '2026-03-23T09:30:00Z',
    refundAmount: 0,
    createdAt: '2026-03-21T13:15:00Z'
  }
];
