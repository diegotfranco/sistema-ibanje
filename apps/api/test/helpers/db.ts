import { execSync } from 'node:child_process';
import { sql as drizzleSql } from 'drizzle-orm';
import { db } from '../../src/db/index.js';
import { monthlyClosings } from '../../src/db/schema.js';

export function reseedDb() {
  const pnpm = process.env.npm_execpath ?? 'pnpm';
  execSync(`${pnpm} exec tsx src/db/seed.ts`, {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
  });
}

/**
 * Truncate every application table, leaving a migrated-but-unseeded database —
 * the clean-slate state seed.prod.ts expects on first boot. The drizzle
 * migration bookkeeping lives in its own `drizzle` schema, so filtering to
 * `public` preserves it. Callers that use this MUST restore the shared fixture
 * (call `reseedDb()` in afterAll), since test files share one database.
 */
export async function emptyDb() {
  const rows = (await db.execute(
    drizzleSql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
  )) as unknown as { tablename: string }[];
  const names = rows.map((r) => r.tablename);
  if (names.length === 0) return;
  const list = names.map((n) => `"${n}"`).join(', ');
  await db.execute(drizzleSql.raw(`TRUNCATE ${list} RESTART IDENTITY CASCADE`));
}

export async function clearMonthlyClosings() {
  await db.delete(monthlyClosings);
}
