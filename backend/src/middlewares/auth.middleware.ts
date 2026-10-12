import type { RequestHandler } from 'express';
import { getRequestToken } from '../lib/auth-cookie.js';
import { UnauthorizedError } from '../lib/errors.js';
import { authService } from '../services/auth.service.js';

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token = getRequestToken(req);
  if (!token) throw new UnauthorizedError();

  req.auth = await authService.authenticate(token);
  next();
};
