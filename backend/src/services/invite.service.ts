import argon2 from 'argon2';
import type { LoginResponse } from '../dto/auth.dto.js';
import type { AcceptInviteRequest, InviteDetailsResponse } from '../dto/invite.dto.js';
import { HttpError, NotFoundError } from '../lib/errors.js';
import { inviteRepository } from '../repositories/invite.repository.js';
import { authService, type ClientMeta } from './auth.service.js';

async function findInvite(token: string) {
  const invite = await inviteRepository.findByToken(token);
  if (!invite) throw new NotFoundError('Invite not found');
  return invite;
}

export const inviteService = {
  async get(token: string): Promise<InviteDetailsResponse> {
    const invite = await findInvite(token);
    if (invite.usedAt || invite.hasPassword) return { state: 'used', email: invite.email };
    return {
      state: 'valid',
      name: invite.name,
      email: invite.email,
      role: invite.role ?? 'No role',
      invitedBy: invite.invitedBy ?? 'An admin',
    };
  },

  async accept(token: string, { password }: AcceptInviteRequest, meta: ClientMeta): Promise<LoginResponse> {
    const invite = await findInvite(token);
    const used = new HttpError(410, 'This link was already used.');
    if (invite.usedAt || invite.hasPassword) throw used;

    const accepted = await inviteRepository.accept(invite.id, invite.userId, await argon2.hash(password));
    if (!accepted) throw used;
    return authService.startSession(
      { id: invite.userId, name: invite.name, email: invite.email, roleId: invite.roleId },
      meta,
    );
  },
};
