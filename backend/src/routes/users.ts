import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, badRequest, notFound, unauthorized } from '../lib/http.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { mapUser } from '../lib/mappers.js';
import { authenticate, requireRoles, type AuthenticatedRequest } from '../middleware/auth.js';

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().default(''),
  role: z.enum(['admin', 'manager', 'coordinator', 'sales', 'customer']),
  active: z.boolean().default(true),
  password: z.string().min(8).optional(),
});

const updateSchema = userSchema.partial();

const profileSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8).optional().default(''),
  avatar: z.string().url().or(z.literal('')).optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

function toRole(role: string) {
  return role.toUpperCase() as 'ADMIN' | 'MANAGER' | 'COORDINATOR' | 'SALES' | 'CUSTOMER';
}

export function createUsersRouter() {
  const router = Router();

  router.use(authenticate);

  router.get('/me', asyncHandler(async (req: AuthenticatedRequest, res) => {
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

  router.patch('/me', asyncHandler(async (req: AuthenticatedRequest, res) => {
    const input = profileSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid profile payload');
    }

    const user = await prisma.user.update({
      where: { id: req.auth!.sub },
      data: {
        fullName: input.data.name,
        phone: input.data.phone,
        avatarUrl: input.data.avatar || null,
      },
    });

    res.json({
      success: true,
      user: mapUser(user),
    });
  }));

  router.patch('/me/password', asyncHandler(async (req: AuthenticatedRequest, res) => {
    const input = passwordSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid password payload');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.auth!.sub },
    });

    if (!user || !(await verifyPassword(input.data.currentPassword, user.passwordHash))) {
      throw unauthorized('Current password is invalid');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(input.data.newPassword),
      },
    });

    res.json({ success: true });
  }));

  router.use(requireRoles('admin'));

  router.get('/', asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      success: true,
      users: users.map(mapUser),
    });
  }));

  router.post('/', asyncHandler(async (req, res) => {
    const input = userSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid user payload');
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
        role: toRole(input.data.role),
        status: input.data.active ? 'ACTIVE' : 'INACTIVE',
        passwordHash: await hashPassword(input.data.password ?? '123456aA@'),
      },
    });

    res.status(201).json({
      success: true,
      user: mapUser(user),
    });
  }));

  router.patch('/:id', asyncHandler(async (req, res) => {
    const userId = String(req.params.id);
    const input = updateSchema.safeParse(req.body);
    if (!input.success) {
      throw badRequest('Invalid user update payload');
    }

    const existing = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existing) {
      throw notFound('User not found');
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: input.data.name ?? existing.fullName,
        email: input.data.email?.toLowerCase() ?? existing.email,
        phone: input.data.phone ?? existing.phone,
        role: input.data.role ? toRole(input.data.role) : existing.role,
        status: input.data.active == null ? existing.status : input.data.active ? 'ACTIVE' : 'INACTIVE',
        passwordHash: input.data.password
          ? await hashPassword(input.data.password)
          : existing.passwordHash,
      },
    });

    res.json({
      success: true,
      user: mapUser(user),
    });
  }));

  router.patch('/:id/status', asyncHandler(async (req, res) => {
    const userId = String(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw notFound('User not found');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        status: user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
      },
    });

    res.json({
      success: true,
      user: mapUser(updated),
    });
  }));

  return router;
}
