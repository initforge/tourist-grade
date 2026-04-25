import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { forbidden, unauthorized } from '../lib/http.js';
import { verifyAccessToken, type AuthTokenPayload } from '../lib/jwt.js';

export interface AuthenticatedRequest extends Request {
  auth?: AuthTokenPayload;
}

export async function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  try {
    const authorization = req.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';

    if (!token) {
      return next(unauthorized());
    }

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, status: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      return next(unauthorized('User account is unavailable'));
    }

    req.auth = payload;
    return next();
  } catch {
    return next(unauthorized());
  }
}

export async function authenticateOptional(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  try {
    const authorization = req.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';

    if (!token) {
      return next();
    }

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, status: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      return next();
    }

    req.auth = payload;
    return next();
  } catch {
    return next();
  }
}

export function requireRoles(...roles: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      return next(unauthorized());
    }

    if (!roles.includes(req.auth.role)) {
      return next(forbidden());
    }

    return next();
  };
}
