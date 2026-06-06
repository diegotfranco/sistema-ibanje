import type { FastifyServerOptions } from 'fastify';
import { env } from './env.js';

// Centralized Pino options so the redaction policy has one home and is unit-testable (see
// test/lgpd-logging-redaction.test.ts). LGPD art.6 VII (data minimization / security): credential
// material and session identifiers must never reach the logs, even if a future log statement
// carelessly serializes a whole request/response. Pino's `redact` censors these paths wherever they
// appear in a logged object; the default Fastify serializers don't log bodies, so this is a
// guardrail against regressions rather than a fix for current behavior.
const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  'req.body.password',
  'req.body.currentPassword',
  'req.body.newPassword',
  'req.body.confirmPassword',
  'req.body.token'
];

export const loggerOptions: FastifyServerOptions['logger'] = {
  level: env.LOG_LEVEL,
  redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },
  transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined
};
