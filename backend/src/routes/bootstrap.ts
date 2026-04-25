import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import {
  mapBooking,
  mapService,
  mapSupplier,
  mapTourGuide,
  mapTourInstance,
  mapTourProgram,
  mapUser,
  mapVoucher,
} from '../lib/mappers.js';
import { asyncHandler } from '../lib/http.js';
import { normalizePayload } from '../lib/text.js';
import { authenticate } from '../middleware/auth.js';

export function createBootstrapRouter() {
  const router = Router();

  router.get('/', authenticate, asyncHandler(async (_req, res) => {
    const [
      users,
      tourPrograms,
      tourInstances,
      suppliers,
      services,
      guides,
      vouchers,
      blogs,
      bookings,
    ] = await Promise.all([
      prisma.user.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.tourProgram.findMany({ orderBy: { code: 'asc' } }),
      prisma.tourInstance.findMany({ include: { program: true }, orderBy: { code: 'asc' } }),
      prisma.supplier.findMany({
        include: {
          serviceVariants: {
            include: { prices: true },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.service.findMany({
        include: { prices: true },
        orderBy: { code: 'asc' },
      }),
      prisma.tourGuide.findMany({ orderBy: { code: 'asc' } }),
      prisma.voucher.findMany({
        include: {
          targets: {
            include: {
              tourProgram: {
                select: { code: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.booking.findMany({
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
      }),
    ]);

    res.json(normalizePayload({
      success: true,
      data: {
        users: users.map(mapUser),
        tourPrograms: tourPrograms.map(mapTourProgram),
        tourInstances: tourInstances.map(mapTourInstance),
        suppliers: suppliers.map(mapSupplier),
        services: services.map(mapService),
        guides: guides.map(mapTourGuide),
        vouchers: vouchers.map(mapVoucher),
        blogs,
        tours: tourPrograms
          .map((program) => program.publicContentJson)
          .filter(Boolean),
        bookings: bookings.map((booking) => mapBooking(booking, {
          tourId:
            ((booking.tourInstance.program.publicContentJson as { id?: string } | null)?.id)
            ?? booking.tourInstance.program.code,
          tourName: booking.tourInstance.programNameSnapshot,
          tourDuration: `${booking.tourInstance.program.durationDays}N${booking.tourInstance.program.durationNights}Đ`,
          tourDate: booking.tourInstance.departureDate.toISOString().slice(0, 10),
        })),
      },
    }));
  }));

  return router;
}
