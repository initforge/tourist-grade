import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AuthTokenPayload {
  sub: string;
  role: string;
  email: string;
  name: string;
}

function asExpiresIn(value: string): SignOptions['expiresIn'] {
  return value as SignOptions['expiresIn'];
}

export function signAccessToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: asExpiresIn(env.JWT_ACCESS_EXPIRES_IN),
  });
}

export function signRefreshToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: asExpiresIn(env.JWT_REFRESH_EXPIRES_IN),
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthTokenPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as AuthTokenPayload;
}
