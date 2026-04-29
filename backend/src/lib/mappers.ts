import type {
  BlogPost,
  Booking,
  BookingPassenger,
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  PaymentTransaction,
  RefundStatus,
  Role,
  Service,
  ServicePrice,
  SpecialDay,
  Supplier,
  SupplierServicePrice,
  SupplierServiceVariant,
  TourGuide,
  TourInstance,
  TourProgram,
  TourReview,
  TourTransport,
  TourType,
  User,
  UserStatus,
  Voucher,
  VoucherTarget,
  VoucherStatus,
} from '@prisma/client';
import { toDateKey, unwrapEstimatePayload } from './coordinator.js';
import { getBookingCreatedExpiryAt, getFinalPaymentDueAt } from './customer.js';

function toNumber(value: { toNumber?: () => number } | number | null | undefined) {
  if (typeof value === 'number') {
    return value;
  }

  return value?.toNumber?.() ?? 0;
}

function toOptionalNumber(value: { toNumber?: () => number } | number | null | undefined) {
  if (value == null) {
    return undefined;
  }

  return toNumber(value);
}

function toLowerRole(role: Role) {
  return role.toLowerCase();
}

function toUserActive(status: UserStatus) {
  return status === 'ACTIVE';
}

function formatPaymentMethod(method: PaymentMethod) {
  return method.toLowerCase();
}

function formatPaymentStatus(status: PaymentStatus) {
  return status.toLowerCase();
}

function formatBookingStatus(status: BookingStatus) {
  return status.toLowerCase();
}

function formatRefundStatus(status: RefundStatus) {
  return status.toLowerCase();
}

function formatTourTransport(transport: TourTransport) {
  return transport === 'MAYBAY' ? 'maybay' : 'xe';
}

function formatTourType(type: TourType) {
  return type === 'MUA_LE' ? 'mua_le' : 'quanh_nam';
}

function formatVoucherStatus(status: VoucherStatus) {
  if (status === 'PENDING_APPROVAL') return 'pending_approval';
  return status.toLowerCase();
}

function mapVoucherStatus(voucher: Pick<Voucher, 'status' | 'startsAt'>) {
  if (voucher.status === 'ACTIVE' && voucher.startsAt.toISOString().slice(0, 10) > new Date().toISOString().slice(0, 10)) {
    return 'upcoming';
  }

  return formatVoucherStatus(voucher.status);
}

export function mapUser(user: User) {
  return {
    id: user.id,
    name: user.fullName,
    email: user.email,
    phone: user.phone ?? '',
    role: toLowerRole(user.role),
    avatar: user.avatarUrl ?? '',
    active: toUserActive(user.status),
  };
}

export function mapTourProgram(program: TourProgram) {
  const itinerary = program.itineraryJson as Array<{
    day: number;
    title: string;
    description: string;
    meals: string[];
    accommodationPoint?: string;
  }>;
  const publicContent = (program.publicContentJson as Record<string, unknown> | null) ?? {};
  const pricingPayload = program.pricingConfigJson as Record<string, unknown>;
  const pricingConfig = (pricingPayload['pricingConfig'] as Record<string, unknown> | undefined) ?? pricingPayload;

  return {
    id: program.code,
    name: program.name,
    departurePoint: program.departurePoint,
    sightseeingSpots: program.sightseeingSpots as string[],
    duration: {
      days: program.durationDays,
      nights: program.durationNights,
    },
    transport: formatTourTransport(program.transport),
    arrivalPoint: program.arrivalPoint ?? undefined,
    tourType: formatTourType(program.tourType),
    lodgingStandard: publicContent['lodgingStandard'] ?? undefined,
    routeDescription: program.description ?? '',
    holiday: program.holidayLabel ?? undefined,
    selectedDates: (publicContent['selectedDates'] as string[] | undefined) ?? [],
    weekdays: (publicContent['weekdays'] as string[] | undefined) ?? [],
    yearRoundStartDate: (publicContent['yearRoundStartDate'] as string | undefined) ?? '',
    yearRoundEndDate: (publicContent['yearRoundEndDate'] as string | undefined) ?? '',
    coverageMonths: (publicContent['coverageMonths'] as number | undefined) ?? 3,
    bookingDeadline: program.bookingDeadline,
    status: program.status.toLowerCase(),
    inactiveReason: (publicContent['inactiveReason'] as string | undefined) ?? undefined,
    rejectionReason: (publicContent['rejectionReason'] as string | undefined) ?? undefined,
    approvalStatus: (publicContent['approvalStatus'] as string | undefined) ?? undefined,
    itinerary,
    pricingConfig,
    draftPricingTables: pricingPayload['draftPricingTables'] ?? undefined,
    draftManualPricing: pricingPayload['draftManualPricing'] ?? undefined,
    draftPricingOverrides: pricingPayload['draftPricingOverrides'] ?? undefined,
    draftPreviewRows: (publicContent['draftPreviewRows'] as unknown[] | undefined) ?? [],
    createdBy: program.createdById,
    createdAt: program.createdAt.toISOString(),
    updatedAt: program.updatedAt.toISOString(),
    submittedAt: (publicContent['submittedAt'] as string | undefined) ?? undefined,
    approvedAt: (publicContent['approvedAt'] as string | undefined) ?? undefined,
    rejectedAt: (publicContent['rejectedAt'] as string | undefined) ?? undefined,
  };
}

export function mapTourInstance(instance: TourInstance & { program?: TourProgram }) {
  const wrappedEstimate = unwrapEstimatePayload(instance.costEstimateJson ?? undefined);

  return {
    id: instance.code,
    programId: instance.program?.code ?? instance.programId,
    programName: instance.programNameSnapshot,
    departureDate: instance.departureDate.toISOString().slice(0, 10),
    status: instance.status.toLowerCase(),
    departurePoint: instance.departurePoint,
    sightseeingSpots: instance.sightseeingSpots as string[],
    transport: formatTourTransport(instance.transport),
    arrivalPoint: instance.arrivalPoint ?? undefined,
    expectedGuests: instance.expectedGuests,
    priceAdult: toNumber(instance.priceAdult),
    priceChild: toNumber(instance.priceChild),
    priceInfant: toOptionalNumber(instance.priceInfant),
    minParticipants: instance.minParticipants,
    bookingDeadline: instance.bookingDeadlineAt.toISOString().slice(0, 10),
    costEstimate: wrappedEstimate.estimate ?? undefined,
    settlement: instance.settlementJson ?? undefined,
    assignedGuide: wrappedEstimate.assignedGuide ?? undefined,
    assignedCoordinatorId: instance.assignedCoordinatorId ?? undefined,
    createdBy: instance.createdById,
    createdAt: instance.createdAt.toISOString(),
    submittedAt: instance.submittedAt?.toISOString(),
    approvedAt: instance.approvedAt?.toISOString(),
    approvedBy: instance.approvedById ?? undefined,
    openedAt: instance.openedAt?.toISOString(),
    closedAt: instance.closedAt?.toISOString(),
    receivedAt: instance.receivedAt?.toISOString(),
    estimatedAt: instance.estimatedAt?.toISOString(),
    estimateApprovedAt: instance.estimateApprovedAt?.toISOString(),
    readyAt: instance.readyAt?.toISOString(),
    startedAt: instance.startedAt?.toISOString(),
    endedAt: instance.endedAt?.toISOString(),
    settledAt: instance.settledAt?.toISOString(),
    cancelledAt: instance.cancelledAt?.toISOString(),
    cancelReason: instance.cancelReason ?? undefined,
    refundTotal: toOptionalNumber(instance.refundTotal),
    warningDate: instance.warningDate?.toISOString().slice(0, 10),
  };
}

export function mapSupplier(
  supplier: Supplier & {
    serviceVariants: Array<
      SupplierServiceVariant & { prices: SupplierServicePrice[] }
    >;
  },
) {
  return {
    id: supplier.id,
    name: supplier.name,
    phone: supplier.phone,
    email: supplier.email ?? '',
    category: supplierTypeLabel(supplier.type),
    service: supplier.serviceSummary ?? '',
    operatingArea: supplier.operatingArea ?? '',
    status: supplier.isActive ? 'Hoạt động' : 'Dừng hoạt động',
    address: supplier.address ?? '',
    establishedYear: supplier.establishedYear ? String(supplier.establishedYear) : '',
    description: supplier.description ?? '',
    services: supplier.serviceVariants
      .filter((item) => !item.isMealService)
      .map(mapSupplierServiceLine),
    mealServices: supplier.serviceVariants
      .filter((item) => item.isMealService)
      .map(mapSupplierServiceLine),
  };
}

function mapSupplierServiceLine(
  item: SupplierServiceVariant & { prices: SupplierServicePrice[] },
) {
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? '',
    unit: item.unit,
    quantity: item.quantity ?? 1,
    capacity: item.capacity ?? undefined,
    transportType: item.transportType ? formatTourTransport(item.transportType) === 'xe' ? 'Xe' : 'Máy bay' : undefined,
    priceMode: item.priceMode === 'QUOTED' ? 'Báo giá' : item.priceMode === 'LISTED' ? 'Niêm yết' : undefined,
    menu: item.menu ?? undefined,
    note: item.note ?? undefined,
    formulaCount: item.isMealService ? 'Giá trị mặc định' : undefined,
    formulaCountDefault: item.isMealService ? '1' : undefined,
    formulaQuantity: item.isMealService ? 'Theo số người' : undefined,
    prices: item.prices.map((price) => ({
      id: price.id,
      fromDate: toDateKey(price.fromDate),
      toDate: toDateKey(price.toDate),
      unitPrice: toNumber(price.unitPrice),
      note: price.note ?? '',
      createdBy: price.createdByName,
    })),
  };
}

function supplierTypeLabel(type: Supplier['type']) {
  switch (type) {
    case 'HOTEL':
      return 'Khách sạn';
    case 'RESTAURANT':
      return 'Nhà hàng';
    case 'TRANSPORT':
      return 'Vận chuyển';
    case 'ATTRACTION':
      return 'Vé tham quan';
    default:
      return 'Các dịch vụ khác';
  }
}

export function mapService(service: Service & { prices: ServicePrice[] }) {
  const mappedFormulaQuantity = service.formulaQuantityDefault === 'Theo số người'
    ? 'Theo số người'
    : mapFormulaOption(service.formulaQuantity);

  return {
    id: service.code,
    name: service.name,
    category: service.category === 'ATTRACTION_TICKET' ? 'Vé tham quan' : 'Các dịch vụ khác',
    unit: service.unit,
    priceMode: service.priceMode === 'QUOTED' ? 'Báo giá' : 'Giá niêm yết',
    setup:
      service.priceSetup === 'BY_AGE'
        ? 'Theo độ tuổi'
        : service.priceSetup === 'NONE'
          ? '-'
          : 'Giá chung',
    status: service.status === 'ACTIVE' ? 'Hoạt động' : 'Dừng hoạt động',
    description: service.description ?? '',
    supplierName: service.supplierName ?? undefined,
    contactInfo: service.contactInfo ?? undefined,
    province: service.province ?? undefined,
    formulaCount: mapFormulaOption(service.formulaCount),
    formulaCountDefault: service.formulaCountDefault ?? undefined,
    formulaQuantity: mappedFormulaQuantity,
    formulaQuantityDefault: service.formulaQuantityDefault ?? undefined,
    prices: service.prices.map((price) => ({
      id: price.id,
      unitPrice: toNumber(price.unitPrice),
      note: price.note ?? '',
      effectiveDate: toDateKey(price.effectiveDate),
      endDate: toDateKey(price.endDate),
      createdBy: price.createdByName,
    })),
  };
}

function mapFormulaOption(value: Service['formulaCount']) {
  switch (value) {
    case 'BY_DAY':
      return 'Theo ngày';
    case 'DEFAULT_VALUE':
      return 'Giá trị mặc định';
    case 'MANUAL':
      return 'Nhập tay';
    default:
      return undefined;
  }
}

export function mapTourGuide(guide: TourGuide) {
  return {
    id: guide.code,
    name: guide.fullName,
    gender: guide.gender === 'MALE' ? 'Nam' : 'Nữ',
    dob: guide.dateOfBirth.toISOString().slice(0, 10),
    phone: guide.phone,
    email: guide.email ?? '',
    address: guide.address ?? '',
    operatingArea: guide.operatingArea ?? '',
    guideCardNumber: guide.guideCardNumber,
    issueDate: guide.issueDate?.toISOString().slice(0, 10) ?? '',
    expiryDate: guide.expiryDate?.toISOString().slice(0, 10) ?? '',
    issuePlace: guide.issuePlace ?? '',
    note: guide.note ?? '',
    languages: guide.languagesJson as string[],
    active: guide.isActive,
  };
}

export function mapVoucher(voucher: Voucher & {
  targets?: Array<VoucherTarget & { tourProgram?: Pick<TourProgram, 'code'> }>;
}) {
  return {
    id: voucher.id,
    code: voucher.code,
    type: voucher.type.toLowerCase(),
    value: voucher.type === 'PERCENT'
      ? `${toNumber(voucher.valueAmount)}%`
      : `${toNumber(voucher.valueAmount).toLocaleString('vi-VN')} đ`,
    startDate: voucher.startsAt.toISOString().slice(0, 10),
    endDate: voucher.endsAt.toISOString().slice(0, 10),
    expiryDate: voucher.endsAt.toISOString().slice(0, 10),
    used: voucher.usedCount,
    limit: voucher.usageLimit,
    applicableTours: voucher.targets?.map((target) => target.tourProgram?.code ?? target.tourProgramId) ?? [],
    status: mapVoucherStatus(voucher),
    rejectionReason: voucher.rejectionReason ?? undefined,
    description: voucher.description ?? undefined,
    createdBy: voucher.createdById ?? undefined,
    createdAt: voucher.createdAt.toISOString().slice(0, 10),
  };
}

export function mapBooking(
  booking: Booking & {
    passengers: BookingPassenger[];
    paymentTransactions: PaymentTransaction[];
    tourInstance: TourInstance & {
      program: Pick<TourProgram, 'code'>;
    };
    review?: Pick<TourReview, 'id' | 'rating' | 'title' | 'comment' | 'createdAt'> | null;
    confirmedBy?: Pick<User, 'fullName'> | null;
    cancelledConfirmedBy?: Pick<User, 'fullName'> | null;
    refundedBy?: Pick<User, 'fullName'> | null;
  },
  options: {
    tourId: string;
    tourName: string;
    tourDuration: string;
    tourDate: string;
  },
) {
  return {
    id: booking.id,
    bookingCode: booking.bookingCode,
    tourId: options.tourId,
    programCode: booking.tourInstance.program.code,
    instanceCode: booking.tourInstance.code,
    tourName: options.tourName,
    tourDate: options.tourDate,
    tourDuration: options.tourDuration,
    userId: booking.userId ?? undefined,
    status: formatBookingStatus(booking.status),
    refundStatus: formatRefundStatus(booking.refundStatus),
    refundBillUrl: booking.refundBillUrl ?? undefined,
    passengers: booking.passengers.map((passenger) => ({
      type: passenger.type.toLowerCase(),
      name: passenger.fullName,
      dob: passenger.dateOfBirth?.toISOString().slice(0, 10) ?? '',
      gender: passenger.gender.toLowerCase(),
      cccd: passenger.cccd ?? undefined,
      nationality: passenger.nationality ?? undefined,
      singleRoomSupplement: toOptionalNumber(passenger.singleRoomSupplement),
    })),
    contactInfo: {
      name: booking.contactName,
      email: booking.contactEmail,
      phone: booking.contactPhone,
      note: booking.contactNote ?? undefined,
    },
    bankInfo: (booking.bankInfoJson as {
      accountNumber: string;
      bankName: string;
      accountHolder: string;
    } | null) ?? undefined,
    totalAmount: toNumber(booking.totalAmount),
    paidAmount: toNumber(booking.paidAmount),
    remainingAmount: toNumber(booking.remainingAmount),
    paymentMethod: formatPaymentMethod(booking.paymentMethod),
    paymentType: booking.paymentType.toLowerCase(),
    paymentStatus: formatPaymentStatus(booking.paymentStatus),
    paymentTransactions: booking.paymentTransactions.map((transaction) => ({
      id: transaction.id,
      amount: toNumber(transaction.amount),
      method: formatPaymentMethod(transaction.method),
      status: formatPaymentStatus(transaction.status) === 'paid' ? 'completed' : formatPaymentStatus(transaction.status),
      paidAt: transaction.paidAt?.toISOString() ?? transaction.createdAt.toISOString(),
      transactionRef: transaction.transactionRef ?? undefined,
      orderCode: transaction.orderCode ?? undefined,
    })),
    promoCode: (booking.payloadJson as { promoCode?: string } | null)?.promoCode,
    discountAmount: toOptionalNumber(booking.discountAmount),
    createdAt: booking.createdAt.toISOString(),
    paymentWindowExpiresAt:
      ((booking.payloadJson as { paymentWindowExpiresAt?: string } | null)?.paymentWindowExpiresAt)
      ?? getBookingCreatedExpiryAt(booking.createdAt).toISOString(),
    finalPaymentDueAt:
      ((booking.payloadJson as { finalPaymentDueAt?: string } | null)?.finalPaymentDueAt)
      ?? getFinalPaymentDueAt(booking.tourInstance.departureDate).toISOString(),
    cancellationReason: booking.cancellationReason ?? undefined,
    cancellationSource: (booking.payloadJson as { cancellationSource?: string } | null)?.cancellationSource,
    cancelledAt: booking.cancelledAt?.toISOString(),
    roomCounts: (booking.roomCountsJson as { single: number; double: number; triple: number } | null) ?? undefined,
    confirmedBy:
      booking.confirmedBy?.fullName
      ?? (booking.payloadJson as { confirmedBy?: string } | null)?.confirmedBy
      ?? booking.confirmedById
      ?? undefined,
    confirmedAt: booking.confirmedAt?.toISOString(),
    cancelledConfirmedBy:
      booking.cancelledConfirmedBy?.fullName
      ?? (booking.payloadJson as { cancelledConfirmedBy?: string } | null)?.cancelledConfirmedBy
      ?? booking.cancelledConfirmedById
      ?? undefined,
    cancelledConfirmedAt:
      booking.cancelledConfirmedAt?.toISOString()
      ?? (booking.payloadJson as { cancelledConfirmedAt?: string } | null)?.cancelledConfirmedAt,
    refundedBy:
      booking.refundedBy?.fullName
      ?? (booking.payloadJson as { refundedBy?: string } | null)?.refundedBy
      ?? booking.refundedById
      ?? undefined,
    refundedAt: booking.refundedAt?.toISOString(),
    refundAmount: toOptionalNumber(booking.refundAmount),
    review: booking.review ? {
      id: booking.review.id,
      rating: booking.review.rating,
      title: booking.review.title ?? '',
      comment: booking.review.comment,
      createdAt: booking.review.createdAt.toISOString(),
    } : undefined,
  };
}

export function mapSpecialDay(day: SpecialDay) {
  return {
    id: day.code,
    name: day.name,
    occasion: day.occasion,
    startDate: day.startDate.toISOString().slice(0, 10),
    endDate: day.endDate.toISOString().slice(0, 10),
    note: day.note ?? '',
  };
}

export function mapProvince(province: { code: string; name: string; hasAirport: boolean }) {
  return {
    id: province.code,
    code: province.code,
    name: province.name,
    hasAirport: province.hasAirport,
  };
}

export function mapBlogPost(post: BlogPost) {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    category: post.category,
    excerpt: post.excerpt ?? '',
    contentMarkdown: post.contentMarkdown,
    coverImageUrl: post.coverImageUrl ?? '',
    publishedAt: post.publishedAt?.toISOString() ?? null,
  };
}

export function mapTourReview(
  review: TourReview & {
    user?: Pick<User, 'fullName'> | null;
  },
) {
  return {
    id: review.id,
    bookingId: review.bookingId,
    rating: review.rating,
    title: review.title ?? '',
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
    authorName: review.user?.fullName ?? 'Khach hang',
  };
}
