import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, notFound } from '../lib/http.js';
import { mapBlogPost } from '../lib/mappers.js';
import { normalizePayload } from '../lib/text.js';

export function createPublicRouter() {
  const router = Router();

  router.get('/tours', asyncHandler(async (_req, res) => {
    const programs = await prisma.tourProgram.findMany({
      where: {
        status: 'ACTIVE',
      },
      orderBy: { code: 'asc' },
    });

    res.json(normalizePayload({
      success: true,
      tours: programs
        .map((item) => item.publicContentJson)
        .filter(Boolean),
    }));
  }));

  router.get('/tours/:slug', asyncHandler(async (req, res) => {
    const slug = String(req.params.slug);
    const programs = await prisma.tourProgram.findMany({
      where: {
        status: 'ACTIVE',
      },
    });

    const tour = programs
      .map((item) => item.publicContentJson as { slug?: string } | null)
      .find((item) => item?.slug === slug);

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
