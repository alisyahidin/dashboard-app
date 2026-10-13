import argon2 from 'argon2';
import { env } from '../config/env.js';
import type { LoginRequest, LoginResponse, MeResponse } from '../dto/auth.dto.js';
import { toUserResponse } from '../dto/user.dto.js';
import { UnauthorizedError } from '../lib/errors.js';
import { signAccessToken, verifyAccessToken } from '../lib/jwt.js';
import { loginThrottle } from '../lib/login-throttle.js';
import { type RoleWithPermissions, roleRepository } from '../repositories/role.repository.js';
import { sessionRepository } from '../repositories/session.repository.js';
import { userRepository } from '../repositories/user.repository.js';

const DUMMY_HASH = await argon2.hash('dummy-password-for-timing');

type ActiveSession = NonNullable<Awaited<ReturnType<typeof sessionRepository.findActiveWithUser>>>;

export type AuthContext = ActiveSession & {
  role: RoleWithPermissions | null;
  permissions: Set<string>;
};

export type ClientMeta = { ipAddress: string | null; userAgent: string | null };

async function loadRole(roleId: string | null): Promise<RoleWithPermissions | null> {
  if (roleId === null) return null;
  return (await roleRepository.findWithPermissions(roleId)) ?? null;
}

export const authService = {
  async login({ email, password }: LoginRequest, meta: ClientMeta): Promise<LoginResponse> {
    loginThrottle.assertAllowed(email, meta.ipAddress);
    const user = await userRepository.findActiveByEmail(email);

    const passwordValid = await argon2.verify(user?.passwordHash ?? DUMMY_HASH, password);
    if (!user?.passwordHash || !passwordValid) {
      loginThrottle.recordFailure(email, meta.ipAddress);
      throw new UnauthorizedError('Invalid email or password');
    }
    loginThrottle.reset(email, meta.ipAddress);

    return this.startSession(user, meta);
  },

  async startSession(
    user: { id: string; name: string; email: string; roleId: string | null },
    meta: ClientMeta,
  ): Promise<LoginResponse> {
    const expiresAt = new Date(Date.now() + env.SESSION_TTL_HOURS * 60 * 60 * 1000);
    const [session, role] = await Promise.all([
      sessionRepository.create({
        userId: user.id,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        expiresAt: expiresAt.toISOString(),
      }),
      loadRole(user.roleId),
    ]);

    const accessToken = await signAccessToken({ sub: user.id, sid: session.id }, expiresAt);

    return {
      tokenType: 'Bearer',
      accessToken,
      expiresAt: expiresAt.toISOString(),
      user: toUserResponse(user, role),
    };
  },

  async authenticate(token: string): Promise<AuthContext> {
    const payload = await verifyAccessToken(token);
    if (!payload) throw new UnauthorizedError();

    const active = await sessionRepository.findActiveWithUser(payload.sid, payload.sub);
    if (!active) throw new UnauthorizedError();

    const role = await loadRole(active.user.roleId);
    return { ...active, role, permissions: new Set(role?.permissions) };
  },

  me({ user, session, role }: AuthContext): MeResponse {
    return {
      user: toUserResponse(user, role),
      session: { expiresAt: new Date(session.expiresAt).toISOString() },
    };
  },

  async logout(token: string | null): Promise<void> {
    if (!token) return;
    const auth = await this.authenticate(token).catch(() => null);
    if (auth) await sessionRepository.revoke(auth.session.id);
  },
};
