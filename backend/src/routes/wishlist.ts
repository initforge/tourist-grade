import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, badRequest, notFound } from '../lib/http.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';

async function resolveProgram(tourRef: string) {
  const trimmed = tourRef.trim();
  if (!trimmed) {
    return null;
  }

  return prisma.tourProgram.findFirst({
    where: {
      OR: [
        { code: trimmed },
        { slug: trimmed },
        {
          publicContentJson: {
            path: ['id'],
            equals: trimmed,
          },
        },
      ],
    },
    select: {
      id: true,
      code: true,
      slug: true,
      publicContentJson: true,
    },
  });
}

export function createWishlistRouter() {
  const router = Router();

  router.use(authenticate);

  router.get('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.auth!.sub },
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
    });

    res.json({
      success: true,
      wishlist: items.map((item) => {
        const publicContent = (item.tourProgram.publicContentJson as { id?: string } | null) ?? {};
        return {
          id: item.id,
          tourId: publicContent.id ?? item.tourProgram.code,
          slug: item.tourProgram.slug,
          addedAt: item.createdAt.toISOString(),
        };
      }),
    });
  }));

  router.post('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
    const tourRef = String(req.body?.tourId ?? req.body?.slug ?? '').trim();
    if (!tourRef) {
      throw badRequest('Tour reference is required');
    }

    const program = await resolveProgram(tourRef);
    if (!program) {
      throw notFound('Tour not found');
    }

    const item = await prisma.wishlistItem.upsert({
      where: {
        userId_tourProgramId: {
          userId: req.auth!.sub,
          tourProgramId: program.id,
        },
      },
      create: {
        userId: req.auth!.sub,
        tourProgramId: program.id,
      },
      update: {},
      include: {
        tourProgram: {
          select: {
            code: true,
            slug: true,
            publicContentJson: true,
          },
        },
      },
    });

    const publicContent = (item.tourProgram.publicContentJson as { id?: string } | null) ?? {};
    res.status(201).json({
      success: true,
      item: {
        id: item.id,
        tourId: publicContent.id ?? item.tourProgram.code,
        slug: item.tourProgram.slug,
        addedAt: item.createdAt.toISOString(),
      },
    });
  }));

  router.delete('/:tourRef', asyncHandler(async (req: AuthenticatedRequest, res) => {
    const program = await resolveProgram(String(req.params.tourRef));
    if (!program) {
      throw notFound('Tour not found');
    }

    await prisma.wishlistItem.deleteMany({
      where: {
        userId: req.auth!.sub,
        tourProgramId: program.id,
      },
    });

    res.json({
      success: true,
      removed: true,
    });
  }));

  return router;
}
