import { describe, it, expect } from 'vitest';
import { passwordField } from '../src/lib/normalize.js';
import { isCommonPassword } from '../src/lib/passwordPolicy.js';

// OWASP-aligned password policy: a 12-char floor (no composition rules), a 64-char ceiling, and a
// breach/common-password reject. Length lives in the Zod schema; the breach check is a separate
// async seam run in the service layer.
describe('passwordField (length policy)', () => {
  it('rejects passwords shorter than 12 chars', () => {
    expect(passwordField.safeParse('short').success).toBe(false);
    expect(passwordField.safeParse('elevenchars').success).toBe(false); // 11
  });

  it('rejects passwords longer than 64 chars', () => {
    expect(passwordField.safeParse('a'.repeat(65)).success).toBe(false);
  });

  it('accepts a 12-char password and a long passphrase with spaces', () => {
    expect(passwordField.safeParse('abcdef123456').success).toBe(true); // exactly 12
    expect(passwordField.safeParse('correct horse battery staple').success).toBe(true);
  });

  it('does not trim — leading/trailing spaces count toward length and are preserved', () => {
    const r = passwordField.safeParse('  spaced pass  ');
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe('  spaced pass  ');
  });
});

describe('isCommonPassword (breach/common-password blocklist)', () => {
  it('returns true for a bundled common password', async () => {
    expect(await isCommonPassword('senha1234567')).toBe(true);
  });

  it('is case-insensitive', async () => {
    expect(await isCommonPassword('SENHA1234567')).toBe(true);
  });

  it('returns false for a strong, unique password', async () => {
    expect(await isCommonPassword('Zx9$kfmqQ2-vunlike-anything')).toBe(false);
  });
});
