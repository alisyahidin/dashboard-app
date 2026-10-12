import type { RequestHandler } from 'express';
import { UnauthorizedError } from '../lib/errors.js';
import { authService } from '../services/auth.service.js';

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
  if (scheme?.toLowerCase() !== 'bearer' || !token) throw new UnauthorizedError();

  req.auth = await authService.authenticate(token);
  next();
};
