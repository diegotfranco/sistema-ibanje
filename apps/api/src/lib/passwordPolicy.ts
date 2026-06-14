import { COMMON_PASSWORDS } from './common-passwords.js';

// Loaded once at module init. Membership is the only operation, so a Set is O(1) per check.
const blocklist = new Set(COMMON_PASSWORDS.map((p) => p.toLowerCase()));

/**
 * True when the password is in the bundled breach/common-password blocklist.
 *
 * Async by design even though the current (offline-Set) implementation is synchronous: it lets us
 * swap in the HIBP range API (a network call) later without changing any call site. Callers
 * `await isCommonPassword(pw)` in the service layer — never inside a sync Zod `.refine`, which the
 * Fastify validator runs synchronously.
 *
 * Only matters for passwords that already clear the 12-char length floor (`passwordField`); shorter
 * breached classics like "123456" are rejected by length first, so the list holds 12+ char entries.
 */
export async function isCommonPassword(password: string): Promise<boolean> {
  return blocklist.has(password.toLowerCase());
}
