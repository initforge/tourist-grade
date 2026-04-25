import { createHash } from 'node:crypto';
import type { User } from '@prisma/client';
import { signAccessToken, signRefreshToken, type AuthTokenPayload } from './jwt.js';

export function hashOpaqueToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function toRoleName(role: User['role']) {
  return role.toLowerCase();
}

export function buildAuthPayload(user: Pick<User, 'id' | 'email' | 'fullName' | 'role'>): AuthTokenPayload {
  return {
    sub: user.id,
    email: user.email,
    name: user.fullName,
    role: toRoleName(user.role),
  };
}

export function createAuthTokens(user: Pick<User, 'id' | 'email' | 'fullName' | 'role'>) {
  const payload = buildAuthPayload(user);

  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}
