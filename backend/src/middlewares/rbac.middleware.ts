import type { RequestHandler } from 'express';
import type { Permission, Role } from '../constants/rbac.js';
import { ForbiddenError, UnauthorizedError } from '../lib/errors.js';

export const requirePermission =
  (...required: Permission[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.auth) throw new UnauthorizedError();
    if (!required.every((permission) => req.auth?.permissions.has(permission))) {
      throw new ForbiddenError();
    }
    next();
  };

export const requireRole =
  (...allowed: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.auth) throw new UnauthorizedError();
    const role = req.auth.role?.name;
    if (!role || !allowed.includes(role as Role)) throw new ForbiddenError();
    next();
  };
