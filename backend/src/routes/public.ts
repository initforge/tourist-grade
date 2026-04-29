import { Router } from 'express';
import { buildPublicTour } from '../lib/public-tours.js';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, notFound } from '../lib/http.js';
import { mapBlogPost } from '../lib/mappers.js';
import { normalizePayload } from '../lib/text.js';

const publicInstanceInclude = {
  bookings: {
    include: {
      passengers: true,
    },
  },
} as const;

const publicReviewInclude = {
  user: {
    select: {
      fullName: true,
    },
  },
} as const;

export function createPublicRouter() {
  const router = Router();

  router.get('/tours', asyncHandler(async (_req, res) => {
    const programs = await prisma.tourProgram.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        instances: {
          include: publicInstanceInclude,
          orderBy: { departureDate: 'asc' },
        },
        reviews: {
          include: publicReviewInclude,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { code: 'asc' },
    });

    const tours = programs
      .map((program) => buildPublicTour(program, program.instances, program.reviews))
      .filter((tour): tour is NonNullable<typeof tour> => tour != null);

    res.json(normalizePayload({
      success: true,
      tours,
    }));
  }));

  router.get('/tours/:slug', asyncHandler(async (req, res) => {
    const slug = String(req.params.slug);
    const program = await prisma.tourProgram.findUnique({
      where: { slug },
      include: {
        instances: {
          include: publicInstanceInclude,
          orderBy: { departureDate: 'asc' },
        },
        reviews: {
          include: publicReviewInclude,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!program || program.status !== 'ACTIVE') {
      throw notFound('Tour not found');
    }

    const tour = buildPublicTour(program, program.instances, program.reviews);
    if (!tour) {
      throw notFound('Tour not found');
    }

    res.json(normalizePayload({
      success: true,
      tour,
    }));
  }));

  router.get('/blogs', asyncHandler(async (_req, res) => {
    const posts = await prisma.blogPost.findMany({
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    });

    res.json(normalizePayload({
      success: true,
      blogs: posts.map(mapBlogPost),
    }));
  }));

  router.get('/blogs/:slug', asyncHandler(async (req, res) => {
    const slug = String(req.params.slug);
    const post = await prisma.blogPost.findUnique({
      where: { slug },
    });

    if (!post) {
      throw notFound('Blog post not found');
    }

    res.json(normalizePayload({
      success: true,
      blog: mapBlogPost(post),
    }));
  }));

  return router;
}
