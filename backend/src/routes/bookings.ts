import { BookingStatus, PaymentStatus, Prisma, RefundStatus } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import {
  runBookingLifecycleJobs,
  UNPAID_BOOKING_CANCEL_REASON,
} from '../lib/booking-lifecycle.js';
import {
  calculateAvailableSeats,
  calculateAgeAtDate,
  calculateVoucherDiscount,
  DEPOSIT_RATIO,
  getBookingCreatedExpiryAt,
  getFinalPaymentDueAt,
  isWithinFinalPaymentWindow,
  normalizePaymentStatusAfterPartial,
  OVERDUE_DEPOSIT_CANCEL_REASON,
  resolveSingleRoomSurcharge,
  validatePassengerAge,
  validatePassengerDocument,
} from '../lib/customer.js';
import { queueEmail, type QueueEmailInput } from '../lib/email-outbox.js';
import { asyncHandler, badRequest, notFound, unauthorized } from '../lib/http.js';
import { mapBooking } from '../lib/mappers.js';
import { syncBookingPaymentWithPayOS } from '../lib/payos-bookings.js';
import { prisma } from '../lib/prisma.js';
import { isPubliclyBookableInstance } from '../lib/public-tours.js';
import { authenticate, authenticateOptional, type AuthenticatedRequest } from '../middleware/auth.js';

const phonePattern = /^(0|\+84)\d{9,10}$/;

const passengerSchema = z.object({
  type: z.enum(['adult', 'child', 'infant']),
  name: z.string().trim().min(1),
  dob: z.string().optional().default(''),
  gender: z.enum(['male', 'female']),
  cccd: z.string().optional(),
  nationality: z.string().optional(),
  singleRoomSupplement: z.number().optional(),
});

const bookingContactSchema = z.object({
  name: z.string().trim().min(2),
  phone: z.string().trim().min(8),
  email: z.string().trim().email(),
  note: z.string().optional().default(''),
});

const roomCountsSchema = z.object({
  single: z.number().int().min(0),
  double: z.number().int().min(0),
  triple: z.number().int().min(0),
});

const createBookingSchema = z.object({
  tourSlug: z.string().min(2),
  scheduleId: z.string().min(2),
  contact: bookingContactSchema,
  passengers: z.array(passengerSchema).min(1),
  roomCounts: roomCountsSchema,
  promoCode: z.string().optional().default(''),
  paymentRatio: z.enum(['deposit', 'full']),
  paymentMethod: z.enum(['bank', 'card']),
});

const updateCheckoutSchema = createBookingSchema.pick({
  scheduleId: true,
  contact: true,
  passengers: true,
  roomCounts: true,
  promoCode: true,
  paymentRatio: true,
  paymentMethod: true,
});

const promoValidationSchema = z.object({
  tourSlug: z.string().min(2),
  scheduleId: z.string().min(2),
  promoCode: z.string().trim().min(2),
  passengers: z.array(passengerSchema).min(1),
});

const refundBillUrlSchema = z.string()
  .max(12_000_000, 'Ảnh bill hoàn tiền quá lớn.')
  .refine((value) => (
    /^data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/i.test(value)
    || /^data:image\/svg\+xml(?:;charset=[^,]+)?(?:;base64)?,.+$/i.test(value)
  ), 'Định dạng ảnh bill hoàn tiền không hợp lệ.');

const updateBookingSchema = z.object({
  status: z.enum(['pending', 'pending_cancel', 'confirmed', 'completed', 'cancelled']).optional(),
  refundStatus: z.enum(['none', 'pending', 'refunded', 'not_required']).optional(),
  cancellationReason: z.string().optional().nullable(),
  cancelledAt: z.string().optional().nullable(),
  bankInfo: z.object({
    accountNumber: z.string(),
    bankName: z.string(),
    accountHolder: z.string(),
  }).optional().nullable(),
  roomCounts: roomCountsSchema.optional(),
  contact: bookingContactSchema.optional(),
  passengers: z.array(passengerSchema).optional(),
  refundBillUrl: refundBillUrlSchema.optional().nullable(),
  refundAmount: z.number().optional().nullable(),
  paidAmount: z.number().optional(),
  remainingAmount: z.number().optional(),
  discountAmount: z.number().optional().nullable(),
  paymentMethodChoice: z.enum(['bank', 'card']).optional(),
  paymentRatio: z.enum(['deposit', 'full']).optional(),
  paymentStatus: z.enum(['unpaid', 'partial', 'paid', 'refunded']).optional(),
  promoCode: z.string().optional().nullable(),
  confirmedBy: z.string().optional().nullable(),
  confirmedAt: z.string().optional().nullable(),
  cancelledConfirmedBy: z.string().optional().nullable(),
  cancelledConfirmedAt: z.string().optional().nullable(),
  refundedBy: z.string().optional().nullable(),
  refundedAt: z.string().optional().nullable(),
});

const cancelRequestSchema = z.object({
  contact: z.string().min(3),
  cancellationReason: z.string().optional().default(''),
  bankInfo: z.object({
    accountNumber: z.string(),
    bankName: z.string(),
    accountHolder: z.string(),
  }).optional(),
});

const bookingInclude = {
  passengers: true,
  paymentTransactions: true,
  review: true,
  confirmedBy: { select: { fullName: true } },
  cancelledConfirmedBy: { select: { fullName: true } },
  refundedBy: { select: { fullName: true } },
  tourInstance: {
    include: {
      program: true,
    },
  },
} as const;

type BookingWithInclude = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>;
type BookableInstance = Prisma.TourInstanceGetPayload<{
  include: {
    bookings: {
      include: {
        passengers: true;
      };
    };
  };
}>;

type BookingDraftInput = z.infer<typeof createBookingSchema>;

function normalizePhone(value: string) {
  return value.replace(/\s+/g, '');
}

function normalizeContact(value: string) {
  return value.trim().toLowerCase();
}

function toNullableJsonInput(value: Prisma.JsonValue | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

async function runBookingExpiryJobs() {
  await runBookingLifecycleJobs(prisma);
}

function bookingMapOptions(booking: BookingWithInclude) {
  return {
    tourId:
      ((booking.tourInstance.program.publicContentJson as { id?: string } | null)?.id)
      ?? booking.tourInstance.program.code,
    tourName: booking.tourInstance.programNameSnapshot,
    tourDuration: `${booking.tourInstance.program.durationDays}N${booking.tourInstance.program.durationNights}D`,
    tourDate: booking.tourInstance.departureDate.toISOString().slice(0, 10),
  };
}

function buildPassengerEmailPayload(passengers: BookingWithInclude['passengers']) {
  return passengers.map((passenger, index) => ({
    order: index + 1,
    type: passenger.type.toLowerCase(),
    name: passenger.fullName,
    dateOfBirth: passenger.dateOfBirth?.toISOString().slice(0, 10) ?? '',
    gender: passenger.gender.toLowerCase(),
    documentNumber: passenger.cccd ?? '',
    nationality: passenger.nationality ?? '',
  }));
}

function buildBookingEmailPayload(booking: BookingWithInclude) {
  return {
    bookingCode: booking.bookingCode,
    tourName: booking.tourInstance.programNameSnapshot,
    tourCode: booking.tourInstance.code,
    tourDate: booking.tourInstance.departureDate.toISOString().slice(0, 10),
    contact: {
      name: booking.contactName,
      email: booking.contactEmail,
      phone: booking.contactPhone,
    },
    totalAmount: Number(booking.totalAmount),
    paidAmount: Number(booking.paidAmount),
    remainingAmount: Number(booking.remainingAmount),
    passengers: buildPassengerEmailPayload(booking.passengers),
  };
}

async function findBookingByIdOrCode(id: string) {
  return prisma.booking.findFirst({
    where: {
      OR: [{ id }, { bookingCode: id }],
    },
    include: bookingInclude,
  });
}

function mapBookingStatus(status: z.infer<typeof updateBookingSchema>['status']) {
  if (!status) return undefined;
  return status.toUpperCase() as BookingStatus;
}

function mapRefundStatus(status: z.infer<typeof updateBookingSchema>['refundStatus']) {
  if (!status) return undefined;
  return status.toUpperCase() as RefundStatus;
}

function mapPaymentStatus(status: z.infer<typeof updateBookingSchema>['paymentStatus']) {
  if (!status) return undefined;
  return status.toUpperCase() as PaymentStatus;
}

function isStaffRole(role: string | undefined) {
  return role === 'sales' || role === 'manager' || role === 'admin';
}

function buildPassengerCreateData(passengers: z.infer<typeof passengerSchema>[]) {
  return passengers.map((passenger) => ({
    type: passenger.type.toUpperCase() as 'ADULT' | 'CHILD' | 'INFANT',
    fullName: passenger.name,
    dateOfBirth: passenger.dob ? new Date(passenger.dob) : null,
    gender: passenger.gender.toUpperCase() as 'MALE' | 'FEMALE',
    cccd: passenger.cccd,
    nationality: passenger.nationality,
    singleRoomSupplement: passenger.singleRoomSupplement ?? null,
  }));
}

function extractCounts(passengers: z.infer<typeof passengerSchema>[]) {
  return passengers.reduce((result, passenger) => {
    result[passenger.type] += 1;
    return result;
  }, { adult: 0, child: 0, infant: 0 });
}

function calculatePassengerSubtotal(
  passengers: z.infer<typeof passengerSchema>[],
  schedule: {
    priceAdult?: number;
    priceChild?: number;
    priceInfant?: number;
  },
) {
  const counts = extractCounts(passengers);
  const singleRoomSupplement = passengers.reduce((sum, passenger) => sum + (passenger.singleRoomSupplement ?? 0), 0);
  const freeInfants = Math.floor(counts.adult / 2);
  const infantsChargedAsChildren = Math.max(0, counts.infant - freeInfants);
  const includedChildren = Math.floor(counts.adult / 2);
  const childrenChargedAsAdults = Math.max(0, counts.child - includedChildren - 1);
  const billableAdults = counts.adult + childrenChargedAsAdults;
  const billableChildren = Math.max(0, counts.child - childrenChargedAsAdults) + infantsChargedAsChildren;
  const billableInfants = Math.max(0, counts.infant - infantsChargedAsChildren);
  const subtotal =
    billableAdults * Number(schedule.priceAdult ?? 0)
    + billableChildren * Number(schedule.priceChild ?? schedule.priceAdult ?? 0)
    + billableInfants * Number(schedule.priceInfant ?? 0)
    + singleRoomSupplement;

  return {
    counts,
    subtotal,
    singleRoomSupplement,
  };
}

function toDecimalNumber(value: { toNumber?: () => number } | number | null | undefined) {
  if (typeof value === 'number') {
    return value;
  }

  return value?.toNumber?.() ?? 0;
}

async function resolveProgramBySlug(tourSlug: string) {
  const program = await prisma.tourProgram.findFirst({
    where: {
      OR: [
        { slug: tourSlug },
        {
          publicContentJson: {
            path: ['slug'],
            equals: tourSlug,
          },
        },
      ],
    },
  });

  if (!program) {
    throw notFound('Tour not found');
  }

  return program;
}

function resolveScheduleFromPublicContent(
  program: { publicContentJson: Prisma.JsonValue | null },
  scheduleId: string,
) {
  const publicContent = ((program.publicContentJson as {
    departureSchedule?: Array<{
      id: string;
      instanceCode?: string;
      programCode?: string;
      date: string;
      priceAdult?: number;
      priceChild?: number;
      priceInfant?: number;
      singleRoomSurcharge?: number;
      availableSeats?: number;
      totalSlots?: number;
      bookingDeadlineAt?: string;
    }>;
    title?: string;
    id?: string;
  } | null) ?? {});

  const schedule =
    publicContent.departureSchedule?.find((item) => item.id === scheduleId)
    ?? publicContent.departureSchedule?.find((item) => item.instanceCode === scheduleId)
    ?? null;

  return {
    publicContent,
    schedule,
  };
}

async function resolveInstanceForSchedule(programId: string, schedule: { date: string; instanceCode?: string }) {
  const departureDate = new Date(schedule.date);
  if (schedule.instanceCode) {
    const byCode = await prisma.tourInstance.findFirst({
      where: {
        programId,
        code: schedule.instanceCode,
      },
      include: {
        bookings: {
          include: {
            passengers: true,
          },
        },
      },
    });

    if (byCode) {
      return byCode;
    }
  }

  const instance = await prisma.tourInstance.findFirst({
    where: {
      programId,
      departureDate,
    },
    include: {
      bookings: {
        include: {
          passengers: true,
        },
      },
    },
  });

  if (!instance) {
    throw notFound('Tour instance not found');
  }

  return instance;
}

async function resolveInstanceForPublicScheduleId(programId: string, scheduleId: string) {
  const candidates = [scheduleId];
  if (scheduleId.includes('-')) {
    candidates.push(scheduleId.split('-').at(-1) ?? scheduleId);
  }

  const instance = await prisma.tourInstance.findFirst({
    where: {
      programId,
      code: { in: candidates.filter(Boolean) },
    },
    include: {
      bookings: {
        include: {
          passengers: true,
        },
      },
    },
  });

  if (!instance) {
    throw notFound('Departure schedule not found');
  }

  return instance;
}

function buildBookableSchedule(
  schedule: {
    id: string;
    date: string;
    priceAdult?: number;
    priceChild?: number;
    priceInfant?: number;
    singleRoomSurcharge?: number;
  },
  instance: BookableInstance,
  publicContent: Record<string, unknown>,
  bookingsForAvailability: BookableInstance['bookings'] = instance.bookings,
) {
  const departureDateKey = instance.departureDate.toISOString().slice(0, 10);
  return {
    id: schedule.id,
    date: schedule.date,
    priceAdult: toDecimalNumber(instance.priceAdult),
    priceChild: toDecimalNumber(instance.priceChild),
    priceInfant: instance.priceInfant == null ? 0 : toDecimalNumber(instance.priceInfant),
    singleRoomSurcharge:
      typeof schedule.singleRoomSurcharge === 'number'
        ? schedule.singleRoomSurcharge
        : resolveSingleRoomSurcharge(publicContent, departureDateKey),
    availableSeats: calculateAvailableSeats(instance, bookingsForAvailability),
    totalSlots: instance.expectedGuests,
    bookingDeadlineAt: instance.bookingDeadlineAt.toISOString(),
    instanceCode: instance.code,
  };
}

async function resolveVoucher(programId: string, promoCode: string) {
  if (!promoCode.trim()) {
    return null;
  }

  const now = new Date();
  const voucher = await prisma.voucher.findFirst({
    where: {
      code: promoCode.trim().toUpperCase(),
      status: 'ACTIVE',
      startsAt: { lte: now },
      endsAt: { gte: now },
      OR: [
        { targets: { none: {} } },
        { targets: { some: { tourProgramId: programId } } },
      ],
    },
  });

  if (!voucher || voucher.usedCount >= voucher.usageLimit) {
    return null;
  }

  return voucher;
}

async function buildBookingDraft(
  program: Awaited<ReturnType<typeof resolveProgramBySlug>>,
  input: BookingDraftInput,
  options: { excludeBookingId?: string; skipAvailabilityCheck?: boolean } = {},
) {
  const { publicContent, schedule } = resolveScheduleFromPublicContent(program, input.scheduleId);
  const instance = schedule
    ? await resolveInstanceForSchedule(program.id, schedule)
    : await resolveInstanceForPublicScheduleId(program.id, input.scheduleId);
  if (!isPubliclyBookableInstance(instance)) {
    throw badRequest('Tour da het han dat hoac khong con mo ban');
  }
  const resolvedSchedule = schedule ?? {
    id: input.scheduleId,
    date: instance.departureDate.toISOString().slice(0, 10),
  };
  const bookingsForAvailability = options.excludeBookingId
    ? instance.bookings.filter((booking) => booking.id !== options.excludeBookingId)
    : instance.bookings;
  const bookableSchedule = buildBookableSchedule(resolvedSchedule, instance, publicContent, bookingsForAvailability);

  if (!phonePattern.test(input.contact.phone.replace(/\s+/g, ''))) {
    throw badRequest('So dien thoai khong hop le');
  }

  if (input.passengers.length === 0) {
    throw badRequest('At least one passenger is required');
  }

  const ageErrors = input.passengers
    .map((passenger, index) => {
      const ageMessage = validatePassengerAge(passenger, instance.departureDate);
      const documentMessage = validatePassengerDocument(passenger);
      if (!ageMessage && !documentMessage) {
        return null;
      }
      return `Passenger ${index + 1}: ${ageMessage ?? documentMessage}`;
    })
    .filter(Boolean);

  if (ageErrors.length > 0) {
    throw badRequest(ageErrors[0] ?? 'Passenger validation failed');
  }

  if (input.paymentRatio === 'deposit' && isWithinFinalPaymentWindow(instance.departureDate)) {
    throw badRequest('Khong the chon thanh toan 50% khi con duoi 7 ngay toi ngay khoi hanh');
  }

  const { counts, subtotal, singleRoomSupplement } = calculatePassengerSubtotal(input.passengers, bookableSchedule);
  const availableSeats = bookableSchedule.availableSeats;
  if (!options.skipAvailabilityCheck && input.passengers.length > availableSeats) {
    throw badRequest('So luong hanh khach vuot qua cho trong con lai');
  }

  const voucher = input.promoCode.trim() ? await resolveVoucher(program.id, input.promoCode) : null;
  if (input.promoCode.trim() && !voucher) {
    throw badRequest('Ma giam gia khong hop le hoac khong ap dung cho tour nay');
  }

  const discountAmount = voucher ? calculateVoucherDiscount(voucher, subtotal) : 0;
  const totalAmount = Math.max(subtotal - discountAmount, 0);

  return {
    program,
    instance,
    publicContent,
    schedule: bookableSchedule,
    counts,
    subtotal,
    totalAmount,
    discountAmount,
    singleRoomSupplement,
    voucher,
    expiresAt: getBookingCreatedExpiryAt(new Date()),
    finalPaymentDueAt: getFinalPaymentDueAt(instance.departureDate),
  };
}

function buildBookingPayloadJson(
  current: Record<string, unknown> | null | undefined,
  input: Pick<BookingDraftInput, 'promoCode' | 'paymentMethod' | 'paymentRatio'>,
  draft: Awaited<ReturnType<typeof buildBookingDraft>>,
) {
  return {
    ...(current ?? {}),
    promoCode: draft.voucher?.code ?? (input.promoCode.trim() || null),
    paymentRatio: input.paymentRatio,
    paymentMethod: input.paymentMethod,
    publicScheduleId: draft.schedule.id,
    instanceCode: draft.instance.code,
    discountAmount: draft.discountAmount,
    paymentWindowExpiresAt: draft.expiresAt.toISOString(),
    finalPaymentDueAt: draft.finalPaymentDueAt.toISOString(),
  } satisfies Prisma.InputJsonObject;
}

export function createBookingsRouter() {
  const router = Router();

  router.get('/lookup', asyncHandler(async (req, res) => {
    await runBookingExpiryJobs();

    const bookingCode = String(req.query.bookingCode ?? '').trim();
    const contactRaw = String(req.query.contact ?? '').trim();
    const contact = normalizeContact(contactRaw);

    let booking = await prisma.booking.findFirst({
      where: { bookingCode },
      include: bookingInclude,
    });

    if (!booking) {
      throw notFound('Booking not found');
    }

    const matchesContact =
      normalizePhone(booking.contactPhone) === normalizePhone(contactRaw)
      || normalizeContact(booking.contactEmail) === contact;

    if (!matchesContact) {
      throw notFound('Booking not found');
    }

    if (booking.paymentMethod === 'PAYOS' && booking.paymentStatus === 'UNPAID') {
      await syncBookingPaymentWithPayOS(prisma, booking.id);
      booking = await prisma.booking.findFirst({
        where: { id: booking.id },
        include: bookingInclude,
      }) ?? booking;
    }

    res.json({
      success: true,
      booking: mapBooking(booking, bookingMapOptions(booking)),
    });
  }));

  router.post('/promo/validate', authenticateOptional, asyncHandler(async (req, res) => {
    const input = promoValidationSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid promo validation payload');
    }

    const program = await resolveProgramBySlug(input.data.tourSlug);
    const draft = await buildBookingDraft(program, {
      ...input.data,
      contact: {
        name: 'Preview Customer',
        phone: '0900000000',
        email: 'preview@travela.vn',
        note: '',
      },
      roomCounts: { single: 0, double: 0, triple: 0 },
      paymentMethod: 'bank',
      paymentRatio: 'full',
    }, { skipAvailabilityCheck: true });

    res.json({
      success: true,
      promo: {
        code: draft.voucher?.code ?? null,
        discountAmount: draft.discountAmount,
        totalAmount: draft.totalAmount,
      },
    });
  }));

  router.post('/public', authenticateOptional, asyncHandler(async (req: AuthenticatedRequest, res) => {
    const input = createBookingSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid booking payload');
    }

    const program = await resolveProgramBySlug(input.data.tourSlug);
    const draft = await buildBookingDraft(program, input.data);
    const createdAt = new Date();

    const booking = await prisma.$transaction(async (tx) => {
      const next = await tx.booking.create({
        data: {
          bookingCode: `BK-${Math.floor(Math.random() * 900000 + 100000)}`,
          tourInstanceId: draft.instance.id,
          userId: req.auth?.role === 'customer' ? req.auth.sub : null,
          status: 'PENDING',
          refundStatus: 'NONE',
          paymentMethod: 'PAYOS',
          paymentType: 'ONLINE',
          paymentStatus: 'UNPAID',
          contactName: input.data.contact.name,
          contactEmail: input.data.contact.email.toLowerCase(),
          contactPhone: input.data.contact.phone,
          contactNote: input.data.contact.note,
          roomCountsJson: input.data.roomCounts,
          totalAmount: draft.totalAmount,
          paidAmount: 0,
          remainingAmount: draft.totalAmount,
          discountAmount: draft.discountAmount,
          payloadJson: buildBookingPayloadJson({}, input.data, draft),
          createdAt,
          passengers: {
            create: buildPassengerCreateData(input.data.passengers),
          },
        },
        include: bookingInclude,
      });

      return next;
    });

    await queueEmail(prisma, {
      template: 'booking_created',
      recipient: booking.contactEmail,
      subject: `Booking ${booking.bookingCode} da duoc tao`,
      bookingId: booking.id,
      createdById: req.auth?.sub,
      payload: {
        ...buildBookingEmailPayload(booking),
        bookingCode: booking.bookingCode,
        amount: Number(booking.totalAmount),
        paymentWindowExpiresAt: draft.expiresAt.toISOString(),
        paymentRatio: input.data.paymentRatio,
      },
    });

    res.status(201).json({
      success: true,
      booking: mapBooking(booking, {
        tourId: draft.publicContent.id ?? program.code,
        tourName: draft.publicContent.title ?? booking.tourInstance.programNameSnapshot,
        tourDuration: `${program.durationDays}N${program.durationNights}D`,
        tourDate: booking.tourInstance.departureDate.toISOString().slice(0, 10),
      }),
    });
  }));

  router.put('/:id/checkout', authenticateOptional, asyncHandler(async (req: AuthenticatedRequest, res) => {
    await runBookingExpiryJobs();

    const input = updateCheckoutSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid booking update payload');
    }

    const booking = await findBookingByIdOrCode(String(req.params.id));
    if (!booking) {
      throw notFound('Booking not found');
    }

    const authenticatedCustomerId = req.auth?.role === 'customer' ? req.auth.sub : null;
    if (authenticatedCustomerId) {
      if (booking.userId && booking.userId !== authenticatedCustomerId) {
        throw unauthorized();
      }
      if (!booking.userId) {
        const incomingContact = normalizeContact(input.data.contact.email || input.data.contact.phone);
        const existingContact = normalizeContact(booking.contactEmail || booking.contactPhone);
        if (incomingContact !== existingContact) {
          throw unauthorized();
        }
      }
    } else {
      const incomingContact = normalizeContact(input.data.contact.email || input.data.contact.phone);
      const existingContact = normalizeContact(booking.contactEmail || booking.contactPhone);
      if (incomingContact !== existingContact) {
        throw unauthorized();
      }
    }

    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      throw badRequest('Booking can no longer be edited');
    }

    const program = await resolveProgramBySlug(booking.tourInstance.program.slug);
    const draft = await buildBookingDraft(program, {
      ...input.data,
      tourSlug: booking.tourInstance.program.slug,
    }, {
      excludeBookingId: booking.id,
    });

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        tourInstanceId: draft.instance.id,
        userId: authenticatedCustomerId ?? booking.userId,
        contactName: input.data.contact.name,
        contactEmail: input.data.contact.email.toLowerCase(),
        contactPhone: input.data.contact.phone,
        contactNote: input.data.contact.note,
        roomCountsJson: input.data.roomCounts,
        totalAmount: draft.totalAmount,
        remainingAmount: Math.max(draft.totalAmount - Number(booking.paidAmount), 0),
        discountAmount: draft.discountAmount,
        payloadJson: buildBookingPayloadJson((booking.payloadJson as Record<string, unknown> | null) ?? {}, input.data, draft),
        passengers: {
          deleteMany: {},
          create: buildPassengerCreateData(input.data.passengers),
        },
      },
      include: bookingInclude,
    });

    if (updated.contactEmail.toLowerCase() !== booking.contactEmail.toLowerCase()) {
      await queueEmail(prisma, {
        template: 'booking_updated',
        recipient: updated.contactEmail,
        subject: `Cap nhat booking ${updated.bookingCode}`,
        bookingId: updated.id,
        createdById: req.auth?.sub,
        payload: {
          bookingCode: updated.bookingCode,
          tourName: updated.tourInstance.programNameSnapshot,
          tourDate: updated.tourInstance.departureDate.toISOString().slice(0, 10),
          amount: Number(updated.totalAmount),
          contact: {
            name: updated.contactName,
            email: updated.contactEmail,
            phone: updated.contactPhone,
          },
        },
      });
    }

    res.json({
      success: true,
      booking: mapBooking(updated, bookingMapOptions(updated)),
    });
  }));

  router.post('/:id/cancel-request', asyncHandler(async (req, res) => {
    await runBookingExpiryJobs();

    const bookingId = String(req.params.id);
    const input = cancelRequestSchema.safeParse(req.body);

    if (!input.success) {
      throw badRequest('Invalid cancellation request');
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: bookingInclude,
    });

    if (!booking) {
      throw notFound('Booking not found');
    }

    const normalizedContact = normalizeContact(input.data.contact);
    const matchesContact =
      normalizePhone(booking.contactPhone) === normalizePhone(input.data.contact)
      || normalizeContact(booking.contactEmail) === normalizedContact;

    if (!matchesContact) {
      throw unauthorized('Contact verification failed');
    }

    const paidAmount = Number(booking.paidAmount);
    const tourDate = booking.tourInstance.departureDate;
    const daysLeft = Math.ceil((tourDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const refundAmount =
      daysLeft >= 30 ? paidAmount
        : daysLeft >= 15 ? Math.round(paidAmount * 0.7)
          : daysLeft >= 7 ? Math.round(paidAmount * 0.5)
            : daysLeft >= 3 ? Math.round(paidAmount * 0.2)
              : 0;

    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'PENDING_CANCEL',
          refundStatus: paidAmount > 0 ? 'PENDING' : 'NOT_REQUIRED',
          cancellationReason: input.data.cancellationReason || 'Khach hang gui yeu cau huy',
          cancelledAt: new Date(),
          bankInfoJson: toNullableJsonInput(input.data.bankInfo ?? booking.bankInfoJson),
          refundAmount,
        },
        include: bookingInclude,
      });

      return next;
    });

    await queueEmail(prisma, {
      template: 'booking_cancel_requested',
      recipient: updated.contactEmail,
      subject: `Yeu cau huy booking ${updated.bookingCode}`,
      bookingId: updated.id,
      payload: {
        bookingCode: updated.bookingCode,
        cancellationReason: updated.cancellationReason,
        refundAmount,
      },
    });

    res.json({
      success: true,
      booking: mapBooking(updated, bookingMapOptions(updated)),
    });
  }));

  router.use(authenticate);

  router.get('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
    await runBookingExpiryJobs();

    const where = req.auth?.role === 'customer'
      ? { userId: req.auth.sub }
      : {};

    let bookings = await prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: { createdAt: 'desc' },
    });

    const unpaidPayOSBookings = bookings.filter((booking) => booking.paymentMethod === 'PAYOS' && booking.paymentStatus === 'UNPAID');
    if (unpaidPayOSBookings.length > 0) {
      await Promise.allSettled(unpaidPayOSBookings.map((booking) => syncBookingPaymentWithPayOS(prisma, booking.id)));
      bookings = await prisma.booking.findMany({
        where,
        include: bookingInclude,
        orderBy: { createdAt: 'desc' },
      });
    }

    res.json({
      success: true,
      bookings: bookings.map((booking) => mapBooking(booking, bookingMapOptions(booking))),
    });
  }));

  router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
    await runBookingExpiryJobs();

    let booking = await findBookingByIdOrCode(String(req.params.id));

    if (!booking) {
      throw notFound('Booking not found');
    }

    if (req.auth?.role === 'customer' && booking.userId !== req.auth.sub) {
      throw unauthorized();
    }

    if (booking.paymentMethod === 'PAYOS' && booking.paymentStatus === 'UNPAID') {
      await syncBookingPaymentWithPayOS(prisma, booking.id);
      booking = await findBookingByIdOrCode(booking.id) ?? booking;
    }

    res.json({
      success: true,
      booking: mapBooking(booking, bookingMapOptions(booking)),
    });
  }));

  router.patch('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
    await runBookingExpiryJobs();

    const input = updateBookingSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid booking update payload');
    }

    const booking = await findBookingByIdOrCode(String(req.params.id));
    if (!booking) {
      throw notFound('Booking not found');
    }

    if (req.auth?.role === 'customer' && booking.userId !== req.auth.sub) {
      throw unauthorized();
    }

    const actorId = req.auth?.sub;
    const actorName = req.auth?.name ?? input.data.confirmedBy ?? input.data.refundedBy ?? 'System';
    const actorCanAudit = isStaffRole(req.auth?.role);
    const nextStatus = mapBookingStatus(input.data.status) ?? booking.status;
    const nextRefundStatus = mapRefundStatus(input.data.refundStatus) ?? booking.refundStatus;
    let nextPaymentStatus = mapPaymentStatus(input.data.paymentStatus) ?? booking.paymentStatus;
    const now = new Date();
    const existingPayload = ((booking.payloadJson as Record<string, unknown> | null) ?? {});
    const nextPayload: Record<string, Prisma.InputJsonValue | null> = {
      ...existingPayload,
    } as Record<string, Prisma.InputJsonValue | null>;

    let confirmedById = booking.confirmedById;
    let confirmedAt = booking.confirmedAt;
    let cancelledConfirmedById = booking.cancelledConfirmedById;
    let cancelledConfirmedAt = booking.cancelledConfirmedAt;
    let refundedById = booking.refundedById;
    let refundedAt = booking.refundedAt;

    const isConfirmTransition = actorCanAudit && nextStatus === 'CONFIRMED' && booking.status !== 'CONFIRMED';
    const isCancelConfirmTransition = actorCanAudit && nextStatus === 'CANCELLED' && booking.status !== 'CANCELLED';
    const refundBillChanged = input.data.refundBillUrl !== undefined && input.data.refundBillUrl !== booking.refundBillUrl;
    const isRefundAuditUpdate = actorCanAudit && refundBillChanged && Boolean(input.data.refundBillUrl);

    if (input.data.paymentRatio !== undefined) {
      nextPayload.paymentRatio = input.data.paymentRatio;
    }
    if (input.data.paymentMethodChoice !== undefined) {
      nextPayload.paymentMethod = input.data.paymentMethodChoice;
    }
    if (input.data.promoCode !== undefined) {
      nextPayload.promoCode = input.data.promoCode;
    }

    if (isConfirmTransition) {
      confirmedById = actorId ?? booking.confirmedById;
      confirmedAt = input.data.confirmedAt ? new Date(input.data.confirmedAt) : now;
      nextPayload.confirmedBy = actorName;
    } else if (input.data.confirmedBy !== undefined) {
      nextPayload.confirmedBy = input.data.confirmedBy ?? null;
    }

    if (isCancelConfirmTransition) {
      cancelledConfirmedById = actorId ?? booking.cancelledConfirmedById;
      cancelledConfirmedAt = input.data.cancelledConfirmedAt ? new Date(input.data.cancelledConfirmedAt) : now;
      nextPayload.cancelledConfirmedBy = actorName;
      nextPayload.cancelledConfirmedAt = cancelledConfirmedAt.toISOString();
    } else {
      if (input.data.cancelledConfirmedBy !== undefined) {
        nextPayload.cancelledConfirmedBy = input.data.cancelledConfirmedBy ?? null;
      }
      if (input.data.cancelledConfirmedAt !== undefined) {
        nextPayload.cancelledConfirmedAt = input.data.cancelledConfirmedAt ?? null;
      }
    }

    if (isRefundAuditUpdate) {
      refundedById = actorId ?? booking.refundedById;
      refundedAt = now;
      nextPaymentStatus = 'REFUNDED';
      nextPayload.refundedBy = actorName;
      nextPayload.refundedAt = now.toISOString();
    } else {
      if (input.data.refundedBy !== undefined) {
        nextPayload.refundedBy = input.data.refundedBy ?? null;
      }
      if (input.data.refundedAt !== undefined) {
        refundedAt = input.data.refundedAt ? new Date(input.data.refundedAt) : null;
        nextPayload.refundedAt = input.data.refundedAt ?? null;
      }
    }

    delete nextPayload.refundBillEditedBy;
    delete nextPayload.refundBillEditedAt;

    const postCommitEmails: QueueEmailInput[] = [];

    const updated = await prisma.$transaction(async (tx): Promise<BookingWithInclude> => {
      const next: BookingWithInclude = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: nextStatus,
          refundStatus: isRefundAuditUpdate ? 'REFUNDED' : nextRefundStatus,
          cancellationReason: input.data.cancellationReason === undefined ? booking.cancellationReason : input.data.cancellationReason,
          cancelledAt: input.data.cancelledAt === undefined
            ? (isCancelConfirmTransition && !booking.cancelledAt ? now : booking.cancelledAt)
            : input.data.cancelledAt ? new Date(input.data.cancelledAt) : null,
          bankInfoJson: input.data.bankInfo === undefined
            ? toNullableJsonInput(booking.bankInfoJson)
            : toNullableJsonInput(input.data.bankInfo),
          roomCountsJson: input.data.roomCounts === undefined
            ? toNullableJsonInput(booking.roomCountsJson)
            : toNullableJsonInput(input.data.roomCounts),
          contactName: input.data.contact?.name ?? booking.contactName,
          contactEmail: input.data.contact?.email?.toLowerCase() ?? booking.contactEmail,
          contactPhone: input.data.contact?.phone ?? booking.contactPhone,
          contactNote: input.data.contact?.note ?? booking.contactNote,
          refundBillUrl: input.data.refundBillUrl === undefined ? booking.refundBillUrl : input.data.refundBillUrl,
          refundAmount: input.data.refundAmount === undefined ? booking.refundAmount : input.data.refundAmount,
          paidAmount: input.data.paidAmount === undefined ? booking.paidAmount : input.data.paidAmount,
          remainingAmount: input.data.remainingAmount === undefined ? booking.remainingAmount : input.data.remainingAmount,
          discountAmount: input.data.discountAmount === undefined ? booking.discountAmount : input.data.discountAmount,
          paymentStatus: nextPaymentStatus,
          confirmedById,
          confirmedAt,
          cancelledConfirmedById,
          cancelledConfirmedAt,
          refundedById,
          refundedAt,
          payloadJson: nextPayload as Prisma.InputJsonObject,
          passengers: input.data.passengers
            ? {
                deleteMany: {},
                create: buildPassengerCreateData(input.data.passengers),
              }
            : undefined,
        },
        include: bookingInclude,
      });

      if (isConfirmTransition) {
        postCommitEmails.push({
          template: 'booking_confirmed',
          recipient: next.contactEmail,
          subject: `Xac nhan booking ${next.bookingCode}`,
          bookingId: next.id,
          createdById: actorId,
          payload: {
            ...buildBookingEmailPayload(next),
            bookingCode: next.bookingCode,
            confirmedBy: actorName,
            confirmedAt: confirmedAt?.toISOString(),
            roomCounts: next.roomCountsJson,
          },
        });
      }

      if (isCancelConfirmTransition) {
        postCommitEmails.push({
          template: 'booking_cancel_confirmed',
          recipient: next.contactEmail,
          subject: `Xac nhan huy booking ${next.bookingCode}`,
          bookingId: next.id,
          createdById: actorId,
          payload: {
            ...buildBookingEmailPayload(next),
            bookingCode: next.bookingCode,
            cancellationReason: next.cancellationReason,
            refundAmount: Number(next.refundAmount ?? 0),
            cancelledConfirmedBy: actorName,
            cancelledConfirmedAt: cancelledConfirmedAt?.toISOString(),
          },
        });
      }

      if (isRefundAuditUpdate) {
        postCommitEmails.push({
          template: booking.refundBillUrl ? 'booking_refund_bill_updated' : 'booking_refund_completed',
          recipient: next.contactEmail,
          subject: booking.refundBillUrl
            ? `Cap nhat bill hoan tien ${next.bookingCode}`
            : `Hoan tien thanh cong ${next.bookingCode}`,
          bookingId: next.id,
          createdById: actorId,
          payload: {
            ...buildBookingEmailPayload(next),
            bookingCode: next.bookingCode,
            cancellationReason: next.cancellationReason,
            cancelledAt: next.cancelledAt?.toISOString(),
            refundAmount: Number(next.refundAmount ?? 0),
            refundBillUrl: next.refundBillUrl,
            refundedBy: actorName,
            refundedAt: refundedAt?.toISOString(),
          },
        });
      }

      return next;
    });

    await Promise.all(postCommitEmails.map((email) => queueEmail(prisma, email)));

    res.json({
      success: true,
      booking: mapBooking(updated, bookingMapOptions(updated)),
    });
  }));

  return router;
}

export {
  OVERDUE_DEPOSIT_CANCEL_REASON,
  UNPAID_BOOKING_CANCEL_REASON,
};
