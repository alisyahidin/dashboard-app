import type { Request, RequestHandler } from 'express';
import { createUserRequestSchema, listUsersQuerySchema, updateUserRequestSchema, userIdParamSchema } from '../dto/user.dto.js';
import { NotFoundError } from '../lib/errors.js';
import { userService } from '../services/user.service.js';

function getUserId(req: Request) {
  const parsed = userIdParamSchema.safeParse(req.params['id']);
  if (!parsed.success) throw new NotFoundError('User not found');
  return parsed.data;
}

export const listUsers: RequestHandler = async (req, res) => {
  res.json(await userService.list(listUsersQuerySchema.parse(req.query)));
};

export const createUser: RequestHandler = async (req, res) => {
  const body = createUserRequestSchema.parse(req.body);
  res.status(201).json(await userService.create(body));
};

export const updateUser: RequestHandler = async (req, res) => {
  const id = getUserId(req);
  const body = updateUserRequestSchema.parse(req.body);
  res.json(await userService.update(id, body));
};
