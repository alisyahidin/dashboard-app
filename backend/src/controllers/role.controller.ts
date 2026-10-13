import type { RequestHandler } from 'express';
import { roleService } from '../services/role.service.js';

export const listRoles: RequestHandler = async (_req, res) => {
  res.json(await roleService.list());
};
