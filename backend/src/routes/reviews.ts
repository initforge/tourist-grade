import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, badRequest, notFound, unauthorized } from '../lib/http.js';
import { prisma } from '../lib/prisma.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';

const createReviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().default(''),
  comment: z.string().trim().min(10).max(2000),
});

export function createReviewsRouter() {
  const router = Router();

  router.use(authenticate);

  router.post('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
    const input = createReviewSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid review payload');
    }

    const booking = await prisma.booking.findUnique({
      where: { id: input.data.bookingId },
      include: {
        review: true,
        tourInstance: true,
      },
    });

    if (!booking) {
      throw notFound('Booking not found');
    }

    if (booking.userId !== req.auth!.sub) {
      throw unauthorized();
    }

    if (booking.status !== 'COMPLETED') {
      throw badRequest('Only completed bookings can be reviewed');
    }

    if (booking.review) {
      throw badRequest('Booking has already been reviewed');
    }

    const review = await prisma.tourReview.create({
      data: {
        bookingId: booking.id,
        userId: req.auth!.sub,
        tourProgramId: booking.tourInstance.programId,
        tourInstanceId: booking.tourInstanceId,
        rating: input.data.rating,
        title: input.data.title || null,
        comment: input.data.comment,
      },
      include: {
        user: {
          select: {
            fullName: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      review: {
        id: review.id,
        bookingId: review.bookingId,
        rating: review.rating,
        title: review.title ?? '',
        comment: review.comment,
        createdAt: review.createdAt.toISOString(),
        authorName: review.user?.fullName ?? 'Khach hang',
      },
    });
  }));

  return router;
}
