import { Router } from 'express';
import { runBookingLifecycleJobs } from '../lib/booking-lifecycle.js';
import { asyncHandler } from '../lib/http.js';
import {
  mapBooking,
  mapProvince,
  mapService,
  mapSpecialDay,
  mapSupplier,
  mapTourGuide,
  mapTourInstance,
  mapTourProgram,
  mapTourReview,
  mapUser,
  mapVoucher,
} from '../lib/mappers.js';
import { prisma } from '../lib/prisma.js';
import { normalizePayload } from '../lib/text.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';

export function createBootstrapRouter() {
  const router = Router();

  router.get('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
    await runBookingLifecycleJobs(prisma);

    const [
      users,
      tourPrograms,
      tourInstances,
      suppliers,
      services,
      guides,
      vouchers,
      specialDays,
      provinces,
      blogs,
      bookings,
      wishlistItems,
      reviews,
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
              tourProgram: { select: { code: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.specialDay.findMany({ orderBy: { startDate: 'asc' } }),
      prisma.province.findMany({ orderBy: { name: 'asc' } }),
      prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.booking.findMany({
        include: {
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
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.wishlistItem.findMany({
        where: { userId: req.auth?.sub },
        include: {
          tourProgram: {
            select: {
              code: true,
              slug: true,
              publicContentJson: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.tourReview.findMany({
        where: { userId: req.auth?.sub },
        include: {
          user: { select: { fullName: true } },
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
        specialDays: specialDays.map(mapSpecialDay),
        provinces: provinces.map(mapProvince),
        blogs,
        tours: tourPrograms
          .map((program) => program.publicContentJson)
          .filter(Boolean),
        bookings: bookings.map((booking) => mapBooking(booking, {
          tourId:
            ((booking.tourInstance.program.publicContentJson as { id?: string } | null)?.id)
            ?? booking.tourInstance.program.code,
          tourName: booking.tourInstance.programNameSnapshot,
          tourDuration: `${booking.tourInstance.program.durationDays}N${booking.tourInstance.program.durationNights}D`,
          tourDate: booking.tourInstance.departureDate.toISOString().slice(0, 10),
        })),
        wishlist: wishlistItems.map((item) => {
          const publicContent = (item.tourProgram.publicContentJson as { id?: string } | null) ?? {};
          return {
            id: item.id,
            tourId: publicContent.id ?? item.tourProgram.code,
            slug: item.tourProgram.slug,
            addedAt: item.createdAt.toISOString(),
          };
        }),
        reviews: reviews.map(mapTourReview),
      },
    }));
  }));

  return router;
}
