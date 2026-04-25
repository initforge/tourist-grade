import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, badRequest, notFound, unauthorized } from '../lib/http.js';
import { mapBooking } from '../lib/mappers.js';
import { authenticate, authenticateOptional, type AuthenticatedRequest } from '../middleware/auth.js';

const passengerSchema = z.object({
  type: z.enum(['adult', 'child', 'infant']),
  name: z.string().min(1),
  dob: z.string().optional().default(''),
  gender: z.enum(['male', 'female']),
  cccd: z.string().optional(),
  nationality: z.string().optional(),
  singleRoomSupplement: z.number().optional(),
});

const createBookingSchema = z.object({
  tourSlug: z.string().min(2),
  scheduleId: z.string().min(2),
  contact: z.object({
    name: z.string().min(2),
    phone: z.string().min(8),
    email: z.string().email(),
    note: z.string().optional().default(''),
  }),
  passengers: z.array(passengerSchema).min(1),
  roomCounts: z.object({
    single: z.number().int().min(0),
    double: z.number().int().min(0),
    triple: z.number().int().min(0),
  }),
  promoCode: z.string().optional().default(''),
  paymentRatio: z.enum(['deposit', 'full']),
  paymentMethod: z.enum(['bank', 'card']),
});

const updateBookingSchema = z.object({
  status: z.enum(['booked', 'pending', 'pending_cancel', 'confirmed', 'completed', 'cancelled']).optional(),
  refundStatus: z.enum(['none', 'pending', 'refunded', 'not_required']).optional(),
  cancellationReason: z.string().optional().nullable(),
  cancelledAt: z.string().optional().nullable(),
  bankInfo: z.object({
    accountNumber: z.string(),
    bankName: z.string(),
    accountHolder: z.string(),
  }).optional().nullable(),
  roomCounts: z.object({
    single: z.number().int().min(0),
    double: z.number().int().min(0),
    triple: z.number().int().min(0),
  }).optional(),
  passengers: z.array(passengerSchema).optional(),
  refundBillUrl: z.string().optional().nullable(),
  refundAmount: z.number().optional().nullable(),
  paidAmount: z.number().optional(),
  remainingAmount: z.number().optional(),
  paymentStatus: z.enum(['unpaid', 'partial', 'paid', 'refunded']).optional(),
  confirmedBy: z.string().optional().nullable(),
  confirmedAt: z.string().optional().nullable(),
  cancelledConfirmedBy: z.string().optional().nullable(),
  cancelledConfirmedAt: z.string().optional().nullable(),
  refundedBy: z.string().optional().nullable(),
  refundedAt: z.string().optional().nullable(),
  refundBillEditedBy: z.string().optional().nullable(),
  refundBillEditedAt: z.string().optional().nullable(),
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

export function createBookingsRouter() {
  const router = Router();

  router.get('/lookup', asyncHandler(async (req, res) => {
    const bookingCode = String(req.query.bookingCode ?? '').trim();
    const contactRaw = String(req.query.contact ?? '').trim();
    const contact = normalizeContact(contactRaw);

    const booking = await prisma.booking.findFirst({
      where: {
        bookingCode,
      },
      include: {
        passengers: true,
        paymentTransactions: true,
        tourInstance: {
          include: {
            program: true,
          },
        },
      },
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

    res.json({
      success: true,
      booking: mapBooking(booking, {
        tourId:
          ((booking.tourInstance.program.publicContentJson as { id?: string } | null)?.id)
          ?? booking.tourInstance.program.code,
        tourName: booking.tourInstance.programNameSnapshot,
        tourDuration: `${booking.tourInstance.program.durationDays}N${booking.tourInstance.program.durationNights}Đ`,
        tourDate: booking.tourInstance.departureDate.toISOString().slice(0, 10),
      }),
    });
  }));

  router.post('/public', authenticateOptional, asyncHandler(async (req: AuthenticatedRequest, res) => {
    const input = createBookingSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid booking payload');
    }

    const program = await prisma.tourProgram.findFirst({
      where: {
        publicContentJson: {
          path: ['slug'],
          equals: input.data.tourSlug,
        },
      },
    });

    if (!program) {
      throw notFound('Tour not found');
    }

    const publicContent = program.publicContentJson as {
      departureSchedule?: Array<{
        id: string;
        date: string;
        priceAdult: number;
        priceChild: number;
        priceInfant?: number;
      }>;
      title?: string;
      duration?: { days: number; nights: number };
      id?: string;
    } | null;

    const schedule = publicContent?.departureSchedule?.find((item) => item.id === input.data.scheduleId);
    if (!schedule) {
      throw notFound('Departure schedule not found');
    }

    const instance = await prisma.tourInstance.findFirst({
      where: {
        programId: program.id,
        departureDate: new Date(schedule.date),
      },
    });

    if (!instance) {
      throw notFound('Tour instance not found');
    }

    const counts = input.data.passengers.reduce((result, passenger) => {
      result[passenger.type] += 1;
      return result;
    }, { adult: 0, child: 0, infant: 0 });

    const totalSingleRoomSupplement = input.data.passengers.reduce((sum, passenger) => sum + (passenger.singleRoomSupplement ?? 0), 0);
    const subtotal =
      counts.adult * schedule.priceAdult +
      counts.child * (schedule.priceChild ?? schedule.priceAdult) +
      counts.infant * (schedule.priceInfant ?? 0) +
      totalSingleRoomSupplement;

    const booking = await prisma.booking.create({
      data: {
        bookingCode: `BK-${Math.floor(Math.random() * 900000 + 100000)}`,
        tourInstanceId: instance.id,
        userId: req.auth?.role === 'customer' ? req.auth.sub : null,
        status: 'BOOKED',
        refundStatus: 'NONE',
        paymentMethod: 'PAYOS',
        paymentType: 'ONLINE',
        paymentStatus: 'UNPAID',
        contactName: input.data.contact.name,
        contactEmail: input.data.contact.email.toLowerCase(),
        contactPhone: input.data.contact.phone,
        contactNote: input.data.contact.note,
        roomCountsJson: input.data.roomCounts,
        totalAmount: subtotal,
        paidAmount: 0,
        remainingAmount: subtotal,
        discountAmount: 0,
        payloadJson: {
          promoCode: input.data.promoCode || undefined,
          paymentRatio: input.data.paymentRatio,
          paymentMethod: input.data.paymentMethod,
        },
        passengers: {
          create: input.data.passengers.map((passenger) => ({
            type: passenger.type.toUpperCase() as 'ADULT' | 'CHILD' | 'INFANT',
            fullName: passenger.name,
            dateOfBirth: passenger.dob ? new Date(passenger.dob) : null,
            gender: passenger.gender.toUpperCase() as 'MALE' | 'FEMALE',
            cccd: passenger.cccd,
            nationality: passenger.nationality,
            singleRoomSupplement: passenger.singleRoomSupplement ?? null,
          })),
        },
      },
      include: {
        passengers: true,
        paymentTransactions: true,
        tourInstance: {
          include: {
            program: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      booking: mapBooking(booking, {
        tourId: publicContent?.id ?? program.code,
        tourName: publicContent?.title ?? booking.tourInstance.programNameSnapshot,
        tourDuration: `${program.durationDays}N${program.durationNights}Đ`,
        tourDate: booking.tourInstance.departureDate.toISOString().slice(0, 10),
      }),
    });
  }));

  router.post('/:id/cancel-request', asyncHandler(async (req, res) => {
    const bookingId = String(req.params.id);
    const input = cancelRequestSchema.safeParse(req.body);

    if (!input.success) {
      throw badRequest('Invalid cancellation request');
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        passengers: true,
        paymentTransactions: true,
        tourInstance: {
          include: {
            program: true,
          },
        },
      },
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
    const daysLeft = Math.ceil((booking.tourInstance.departureDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const refundAmount =
      daysLeft >= 30 ? paidAmount
      : daysLeft >= 15 ? Math.round(paidAmount * 0.7)
      : daysLeft >= 7 ? Math.round(paidAmount * 0.5)
      : daysLeft >= 3 ? Math.round(paidAmount * 0.2)
      : 0;

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'PENDING_CANCEL',
        refundStatus: paidAmount > 0 ? 'PENDING' : 'NOT_REQUIRED',
        cancellationReason: input.data.cancellationReason || 'Khách hàng gửi yêu cầu hủy',
        cancelledAt: new Date(),
        bankInfoJson: toNullableJsonInput(input.data.bankInfo ?? booking.bankInfoJson),
        refundAmount,
      },
      include: {
        passengers: true,
        paymentTransactions: true,
        tourInstance: {
          include: {
            program: true,
          },
        },
      },
    });

    res.json({
      success: true,
      booking: mapBooking(updated, {
        tourId:
          ((updated.tourInstance.program.publicContentJson as { id?: string } | null)?.id)
          ?? updated.tourInstance.program.code,
        tourName: updated.tourInstance.programNameSnapshot,
        tourDuration: `${updated.tourInstance.program.durationDays}N${updated.tourInstance.program.durationNights}Đ`,
        tourDate: updated.tourInstance.departureDate.toISOString().slice(0, 10),
      }),
    });
  }));

  router.use(authenticate);

  router.get('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
    const where = req.auth?.role === 'customer'
      ? { userId: req.auth.sub }
      : {};

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        passengers: true,
        paymentTransactions: true,
        tourInstance: {
          include: {
            program: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      bookings: bookings.map((booking) => mapBooking(booking, {
        tourId:
          ((booking.tourInstance.program.publicContentJson as { id?: string } | null)?.id)
          ?? booking.tourInstance.program.code,
        tourName: booking.tourInstance.programNameSnapshot,
        tourDuration: `${booking.tourInstance.program.durationDays}N${booking.tourInstance.program.durationNights}Đ`,
        tourDate: booking.tourInstance.departureDate.toISOString().slice(0, 10),
      })),
    });
  }));

  router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
    const bookingId = String(req.params.id);
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        passengers: true,
        paymentTransactions: true,
        tourInstance: {
          include: {
            program: true,
          },
        },
      },
    });

    if (!booking) {
      throw notFound('Booking not found');
    }

    if (req.auth?.role === 'customer' && booking.userId !== req.auth.sub) {
      throw unauthorized();
    }

    res.json({
      success: true,
      booking: mapBooking(booking, {
        tourId:
          ((booking.tourInstance.program.publicContentJson as { id?: string } | null)?.id)
          ?? booking.tourInstance.program.code,
        tourName: booking.tourInstance.programNameSnapshot,
        tourDuration: `${booking.tourInstance.program.durationDays}N${booking.tourInstance.program.durationNights}Đ`,
        tourDate: booking.tourInstance.departureDate.toISOString().slice(0, 10),
      }),
    });
  }));

  router.patch('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
    const bookingId = String(req.params.id);
    const input = updateBookingSchema.safeParse(req.body);

    if (!input.success) {
      throw badRequest('Invalid booking update payload');
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        passengers: true,
        paymentTransactions: true,
        tourInstance: {
          include: {
            program: true,
          },
        },
      },
    });

    if (!booking) {
      throw notFound('Booking not found');
    }

    if (req.auth?.role === 'customer' && booking.userId !== req.auth.sub) {
      throw unauthorized();
    }

    const nextPayload = {
      ...((booking.payloadJson as Record<string, unknown> | null) ?? {}),
      ...(input.data.confirmedBy !== undefined ? { confirmedBy: input.data.confirmedBy ?? undefined } : {}),
      ...(input.data.cancelledConfirmedBy !== undefined ? { cancelledConfirmedBy: input.data.cancelledConfirmedBy ?? undefined } : {}),
      ...(input.data.cancelledConfirmedAt !== undefined ? { cancelledConfirmedAt: input.data.cancelledConfirmedAt ?? undefined } : {}),
      ...(input.data.refundedBy !== undefined ? { refundedBy: input.data.refundedBy ?? undefined } : {}),
      ...(input.data.refundBillEditedBy !== undefined ? { refundBillEditedBy: input.data.refundBillEditedBy ?? undefined } : {}),
      ...(input.data.refundBillEditedAt !== undefined ? { refundBillEditedAt: input.data.refundBillEditedAt ?? undefined } : {}),
    };

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: input.data.status ? input.data.status.toUpperCase() as 'BOOKED' | 'PENDING' | 'PENDING_CANCEL' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' : booking.status,
        refundStatus: input.data.refundStatus ? input.data.refundStatus.toUpperCase() as 'NONE' | 'PENDING' | 'REFUNDED' | 'NOT_REQUIRED' : booking.refundStatus,
        cancellationReason: input.data.cancellationReason === undefined ? booking.cancellationReason : input.data.cancellationReason,
        cancelledAt: input.data.cancelledAt === undefined ? booking.cancelledAt : input.data.cancelledAt ? new Date(input.data.cancelledAt) : null,
        bankInfoJson: input.data.bankInfo === undefined
          ? toNullableJsonInput(booking.bankInfoJson)
          : toNullableJsonInput(input.data.bankInfo),
        roomCountsJson: input.data.roomCounts === undefined
          ? toNullableJsonInput(booking.roomCountsJson)
          : toNullableJsonInput(input.data.roomCounts),
        refundBillUrl: input.data.refundBillUrl === undefined ? booking.refundBillUrl : input.data.refundBillUrl,
        refundAmount: input.data.refundAmount === undefined ? booking.refundAmount : input.data.refundAmount,
        paidAmount: input.data.paidAmount === undefined ? booking.paidAmount : input.data.paidAmount,
        remainingAmount: input.data.remainingAmount === undefined ? booking.remainingAmount : input.data.remainingAmount,
        paymentStatus: input.data.paymentStatus ? input.data.paymentStatus.toUpperCase() as 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED' : booking.paymentStatus,
        confirmedById: booking.confirmedById,
        confirmedAt: input.data.confirmedAt === undefined ? booking.confirmedAt : input.data.confirmedAt ? new Date(input.data.confirmedAt) : null,
        refundedById: booking.refundedById,
        refundedAt: input.data.refundedAt === undefined ? booking.refundedAt : input.data.refundedAt ? new Date(input.data.refundedAt) : null,
        payloadJson: nextPayload,
        passengers: input.data.passengers
          ? {
              deleteMany: {},
              create: input.data.passengers.map((passenger) => ({
                type: passenger.type.toUpperCase() as 'ADULT' | 'CHILD' | 'INFANT',
                fullName: passenger.name,
                dateOfBirth: passenger.dob ? new Date(passenger.dob) : null,
                gender: passenger.gender.toUpperCase() as 'MALE' | 'FEMALE',
                cccd: passenger.cccd,
                nationality: passenger.nationality,
                singleRoomSupplement: passenger.singleRoomSupplement ?? null,
              })),
            }
          : undefined,
      },
      include: {
        passengers: true,
        paymentTransactions: true,
        tourInstance: {
          include: {
            program: true,
          },
        },
      },
    });

    res.json({
      success: true,
      booking: mapBooking(updated!, {
        tourId:
          ((updated!.tourInstance.program.publicContentJson as { id?: string } | null)?.id)
          ?? updated!.tourInstance.program.code,
        tourName: updated!.tourInstance.programNameSnapshot,
        tourDuration: `${updated!.tourInstance.program.durationDays}N${updated!.tourInstance.program.durationNights}Đ`,
        tourDate: updated!.tourInstance.departureDate.toISOString().slice(0, 10),
      }),
    });
  }));

  return router;
}
