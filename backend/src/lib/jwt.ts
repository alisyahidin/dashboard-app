import { jwtVerify, SignJWT } from 'jose';
import { env } from '../config/env.js';

const secret = new TextEncoder().encode(env.JWT_SECRET);
const ALG = 'HS256';

export type AccessTokenPayload = { sub: string; sid: string };

export function signAccessToken(payload: AccessTokenPayload, expiresAt: Date) {
  return new SignJWT({ sid: payload.sid })
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: [ALG] });
    if (typeof payload.sub !== 'string' || typeof payload['sid'] !== 'string') return null;
    return { sub: payload.sub, sid: payload['sid'] };
  } catch {
    return null;
  }
}
