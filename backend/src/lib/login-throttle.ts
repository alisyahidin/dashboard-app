import { HttpError } from './errors.js';

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

const failures = new Map<string, { count: number; resetAt: number }>();

function keyOf(email: string, ip: string | null) {
  return `${ip ?? 'unknown'}|${email}`;
}

export class TooManyAttemptsError extends HttpError {
  constructor(public readonly retryAfterSeconds: number) {
    const minutes = Math.ceil(retryAfterSeconds / 60);
    super(429, `Too many sign-in attempts. Try again in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`);
    this.name = 'TooManyAttemptsError';
  }
}

export const loginThrottle = {
  assertAllowed(email: string, ip: string | null) {
    const entry = failures.get(keyOf(email, ip));
    if (!entry) return;
    const now = Date.now();
    if (entry.resetAt <= now) {
      failures.delete(keyOf(email, ip));
      return;
    }
    if (entry.count >= MAX_FAILURES) throw new TooManyAttemptsError(Math.ceil((entry.resetAt - now) / 1000));
  },

  recordFailure(email: string, ip: string | null) {
    const key = keyOf(email, ip);
    const now = Date.now();
    const entry = failures.get(key);
    if (!entry || entry.resetAt <= now) failures.set(key, { count: 1, resetAt: now + WINDOW_MS });
    else entry.count += 1;
  },

  reset(email: string, ip: string | null) {
    failures.delete(keyOf(email, ip));
  },
};
