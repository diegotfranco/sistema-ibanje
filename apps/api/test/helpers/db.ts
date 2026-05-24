import { execSync } from 'node:child_process';
import { db } from '../../src/db/index.js';
import { monthlyClosings } from '../../src/db/schema.js';

export function reseedDb() {
  const pnpm = process.env.npm_execpath ?? 'pnpm';
  execSync(`${pnpm} exec tsx src/db/seed.ts`, {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
  });
}

export async function clearMonthlyClosings() {
  await db.delete(monthlyClosings);
}
