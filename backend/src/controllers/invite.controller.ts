import type { Request, RequestHandler } from 'express';
import { acceptInviteRequestSchema, inviteTokenParamSchema } from '../dto/invite.dto.js';
import { setAuthCookie } from '../lib/auth-cookie.js';
import { NotFoundError } from '../lib/errors.js';
import { inviteService } from '../services/invite.service.js';

function getToken(req: Request) {
  const parsed = inviteTokenParamSchema.safeParse(req.params['token']);
  if (!parsed.success) throw new NotFoundError('Invite not found');
  return parsed.data;
}

export const getInvite: RequestHandler = async (req, res) => {
  res.json(await inviteService.get(getToken(req)));
};

export const acceptInvite: RequestHandler = async (req, res) => {
  const token = getToken(req);
  const body = acceptInviteRequestSchema.parse(req.body);
  const { accessToken, expiresAt, tokenType, ...response } = await inviteService.accept(token, body, {
    ipAddress: req.ip ?? null,
    userAgent: req.get('user-agent') ?? null,
  });
  setAuthCookie(res, accessToken, new Date(expiresAt));
  res.json(response);
};
