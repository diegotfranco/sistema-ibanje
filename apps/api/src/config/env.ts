import { z } from 'zod';
import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(process.cwd(), '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000), // coerces "3000" → 3000
  LOG_LEVEL: z.string().default('info'),
  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),
  SESSION_SECRET: z.string().min(32),
  ARGON2_PEPPER: z.string().min(32),
  MINIO_ENDPOINT: z.url(),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_BUCKET: z.string().min(1),
  CORS_ORIGIN: z.url().default('http://localhost:5173'),
  RESEND_API_KEY: z.string().min(1),
  // Bare verified-sender address (e.g. no-reply@your-domain). Must be DNS-verified on
  // Resend. The human-facing display name is derived from church_settings.name at send
  // time (see lib/email.ts), not stored here.
  EMAIL_FROM_ADDRESS: z.email(),
  FRONTEND_URL: z.url().default('http://localhost:5173'),
  // First-admin bootstrap — consumed only by the production seed (seed.prod.ts).
  // When ADMIN_EMAIL/ADMIN_PASSWORD are set, the prod seed creates the initial
  // Administrador. Left unset, the prod seed inserts structural data only.
  ADMIN_EMAIL: z.email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
  ADMIN_NAME: z.string().min(1).max(96).default('Administrador')
});

export const env = envSchema.parse(process.env);
