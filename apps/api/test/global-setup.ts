import { config } from 'dotenv';
import { resolve } from 'node:path';
import postgres from 'postgres';
import { execSync } from 'node:child_process';

const ROOT_ENV = resolve(process.cwd(), '../../.env');
config({ path: ROOT_ENV });

// Derive a test DB URL from DATABASE_URL by appending `_test` to the database name.
const baseUrl = process.env.DATABASE_URL;
if (!baseUrl) throw new Error('DATABASE_URL not set in root .env');
const url = new URL(baseUrl);
const baseDb = url.pathname.replace(/^\//, '');
const testDb = `${baseDb}_test`;
url.pathname = `/${testDb}`;
const TEST_DATABASE_URL = url.toString();

// Postgres admin URL (connect to the default `postgres` DB to drop/create the test DB)
const adminUrl = new URL(baseUrl);
adminUrl.pathname = '/postgres';

export default async function setup() {
  // Drop & recreate the test DB
  const adminSql = postgres(adminUrl.toString(), { max: 1 });
  try {
    await adminSql.unsafe(`DROP DATABASE IF EXISTS ${testDb} WITH (FORCE)`);
    await adminSql.unsafe(`CREATE DATABASE ${testDb}`);
  } finally {
    await adminSql.end();
  }

  // Set env so drizzle-kit and test workers use the test DB.
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  process.env.NODE_ENV = 'test';

  // Run migrations against the test DB
  const pnpmBin = require.resolve('pnpm/bin/pnpm.cjs');
  execSync(`${pnpmBin} exec drizzle-kit migrate`, {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL }
  });

  const { seed } = await import('../src/db/seed.js');
  await seed();
}
