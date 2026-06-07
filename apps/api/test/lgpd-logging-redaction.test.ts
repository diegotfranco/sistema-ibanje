import { describe, it, expect } from 'vitest';
import { loggerOptions } from '../src/config/logger.js';

// LGPD art.6 VII (security / data minimization): the logger must be configured to censor credential
// material and session identifiers so they can never leak into logs. We assert the policy
// structurally (the redact paths are present) rather than capturing log output — the value is that
// dropping a path, or replacing `loggerOptions` with a bare `{ level }`, trips CI.
describe('LGPD: logger redaction policy', () => {
  const options = loggerOptions as { redact?: { paths?: string[]; censor?: string } };

  it('configures Pino redaction with a censor', () => {
    expect(options.redact).toBeDefined();
    expect(options.redact?.censor).toBe('[REDACTED]');
  });

  it.each([
    'req.headers.authorization',
    'req.headers.cookie',
    'res.headers["set-cookie"]',
    'req.body.password',
    'req.body.currentPassword',
    'req.body.newPassword',
    'req.body.confirmPassword',
    'req.body.token'
  ])('redacts %s', (path) => {
    expect(options.redact?.paths).toContain(path);
  });
});
