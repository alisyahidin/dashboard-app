import type { CookieOptions, Request, Response } from 'express';
import { env } from '../config/env.js';

export const ACCESS_TOKEN_COOKIE = 'access_token';

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

export function setAuthCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(ACCESS_TOKEN_COOKIE, token, { ...cookieOptions, expires: expiresAt });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(ACCESS_TOKEN_COOKIE, cookieOptions);
}

export function getRequestToken(req: Request): string | null {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
  if (scheme?.toLowerCase() === 'bearer' && token) return token;

  const cookie: unknown = req.cookies?.[ACCESS_TOKEN_COOKIE];
  return typeof cookie === 'string' && cookie ? cookie : null;
}
