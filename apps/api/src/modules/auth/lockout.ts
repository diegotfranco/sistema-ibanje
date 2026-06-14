import { getRedis } from '../../lib/redis.js';

// Soft, per-account login lockout layered on top of the IP rate-limit on POST /auth/login.
// The IP limit is shared (a NAT'd church office can collectively trip it, a rotating-IP attacker
// slips under it); this isolates the throttle to the targeted email instead. Soft on purpose:
// a temporary window, never a permanent lock — permanent lockout would itself be a DoS lever
// (an attacker could lock a known admin out at will). Callers keep the response generic so the
// lock state is never disclosed (no enumeration, no "you're locked" confirmation).
const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 15 * 60; // 15 minutes

function failKey(email: string): string {
  return `login:fail:${email.toLowerCase()}`;
}

/** True once MAX_ATTEMPTS failures have accumulated within the window. */
export async function isLoginLocked(email: string): Promise<boolean> {
  const redis = await getRedis();
  const count = await redis.get(failKey(email));
  return count !== null && Number(count) >= MAX_ATTEMPTS;
}

/** Record one failed attempt; the first failure starts the sliding-expiry window. */
export async function registerLoginFailure(email: string): Promise<void> {
  const redis = await getRedis();
  const key = failKey(email);
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, WINDOW_SECONDS);
  }
}

/** Clear the counter — called on a successful login so a returning user isn't penalized. */
export async function clearLoginFailures(email: string): Promise<void> {
  const redis = await getRedis();
  await redis.del(failKey(email));
}
