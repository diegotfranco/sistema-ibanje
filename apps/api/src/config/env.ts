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
  CORS_ORIGIN: z.url().default('http://localhost:5173')
});

export const env = envSchema.parse(process.env);
