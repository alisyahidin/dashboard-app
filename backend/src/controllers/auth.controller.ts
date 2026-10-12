import type { Request, RequestHandler } from 'express';
import { loginRequestSchema } from '../dto/auth.dto.js';
import { UnauthorizedError } from '../lib/errors.js';
import { authService } from '../services/auth.service.js';

function getAuth(req: Request) {
  if (!req.auth) throw new UnauthorizedError();
  return req.auth;
}

export const login: RequestHandler = async (req, res) => {
  const body = loginRequestSchema.parse(req.body);
  const result = await authService.login(body, {
    ipAddress: req.ip ?? null,
    userAgent: req.get('user-agent') ?? null,
  });
  res.json(result);
};

export const me: RequestHandler = (req, res) => {
  res.json(authService.me(getAuth(req)));
};

export const logout: RequestHandler = async (req, res) => {
  await authService.logout(getAuth(req));
  res.status(204).end();
};
