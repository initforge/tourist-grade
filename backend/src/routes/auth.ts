import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, badRequest, unauthorized } from '../lib/http.js';
import { createAuthTokens, hashOpaqueToken } from '../lib/auth.js';
import { mapUser } from '../lib/mappers.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';
import { verifyRefreshToken } from '../lib/jwt.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(8),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

const logoutSchema = refreshSchema.partial();

export function createAuthRouter() {
  const router = Router();

  router.post('/login', asyncHandler(async (req, res) => {
    const input = loginSchema.safeParse(req.body);

    if (!input.success) {
      throw badRequest('Invalid login payload');
    }

    const user = await prisma.user.findUnique({
      where: { email: input.data.email.toLowerCase() },
    });

    if (!user || !(await verifyPassword(input.data.password, user.passwordHash))) {
      throw unauthorized('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw unauthorized('This account has been disabled');
    }

    const tokens = createAuthTokens(user);
    const refreshPayload = verifyRefreshToken(tokens.refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashOpaqueToken(tokens.refreshToken),
        expiresAt,
      },
    });

    res.json({
      success: true,
      user: mapUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      auth: refreshPayload,
    });
  }));

  router.post('/register', asyncHandler(async (req, res) => {
    const input = registerSchema.safeParse(req.body);

    if (!input.success) {
      throw badRequest('Invalid registration payload');
    }

    const existing = await prisma.user.findUnique({
      where: { email: input.data.email.toLowerCase() },
      select: { id: true },
    });

    if (existing) {
      throw badRequest('Email already exists');
    }

    const user = await prisma.user.create({
      data: {
        email: input.data.email.toLowerCase(),
        fullName: input.data.name,
        phone: input.data.phone,
        role: 'CUSTOMER',
        status: 'ACTIVE',
        passwordHash: await hashPassword(input.data.password),
      },
    });

    const tokens = createAuthTokens(user);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashOpaqueToken(tokens.refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.status(201).json({
      success: true,
      user: mapUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  }));

  router.get('/me', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.sub },
    });

    if (!user) {
      throw unauthorized();
    }

    res.json({
      success: true,
      user: mapUser(user),
    });
  }));

  router.post('/refresh', asyncHandler(async (req, res) => {
    const input = refreshSchema.safeParse(req.body);

    if (!input.success) {
      throw badRequest('Missing refresh token');
    }

    const payload = verifyRefreshToken(input.data.refreshToken);
    const stored = await prisma.refreshToken.findFirst({
      where: {
        userId: payload.sub,
        tokenHash: hashOpaqueToken(input.data.refreshToken),
        revokedAt: null,
      },
      include: {
        user: true,
      },
    });

    if (!stored || stored.expiresAt.getTime() < Date.now()) {
      throw unauthorized('Refresh token is invalid or expired');
    }

    const tokens = createAuthTokens(stored.user);
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    await prisma.refreshToken.create({
      data: {
        userId: stored.userId,
        tokenHash: hashOpaqueToken(tokens.refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: mapUser(stored.user),
    });
  }));

  router.post('/logout', asyncHandler(async (req, res) => {
    const input = logoutSchema.safeParse(req.body ?? {});

    if (input.success && input.data.refreshToken) {
      await prisma.refreshToken.updateMany({
        where: {
          tokenHash: hashOpaqueToken(input.data.refreshToken),
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }

    res.json({ success: true });
  }));

  return router;
}
