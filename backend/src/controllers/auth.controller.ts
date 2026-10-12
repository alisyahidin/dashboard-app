import type { Request, RequestHandler } from 'express';
import { loginRequestSchema } from '../dto/auth.dto.js';
import { clearAuthCookie, getRequestToken, setAuthCookie } from '../lib/auth-cookie.js';
import { UnauthorizedError } from '../lib/errors.js';
import { authService } from '../services/auth.service.js';

function getAuth(req: Request) {
  if (!req.auth) throw new UnauthorizedError();
  return req.auth;
}

export const login: RequestHandler = async (req, res) => {
  const body = loginRequestSchema.parse(req.body);
  const { accessToken, expiresAt, tokenType, ...response } = await authService.login(body, {
    ipAddress: req.ip ?? null,
    userAgent: req.get('user-agent') ?? null,
  });
  setAuthCookie(res, accessToken, new Date(expiresAt));
  res.json(response);
};

export const me: RequestHandler = (req, res) => {
  res.json(authService.me(getAuth(req)));
};

export const logout: RequestHandler = async (req, res) => {
  await authService.logout(getRequestToken(req));
  clearAuthCookie(res);
  res.status(204).end();
};
