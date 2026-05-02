import { z } from 'zod';
import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(__dirname, '../../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000), // coerces "3000" → 3000
  LOG_LEVEL: z.string().default('info'),
  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),
  SESSION_SECRET: z.string().min(32),
  ARGON2_PEPPER: z.string().min(32)
});

export const env = envSchema.parse(process.env);
