import type { RequestHandler } from 'express';
import { listUsersQuerySchema } from '../dto/user.dto.js';
import { userService } from '../services/user.service.js';

export const listUsers: RequestHandler = async (req, res) => {
  res.json(await userService.list(listUsersQuerySchema.parse(req.query)));
};
