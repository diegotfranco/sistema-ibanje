import { execSync } from 'node:child_process';

export function reseedDb() {
  const pnpm = process.env.npm_execpath ?? 'pnpm';
  execSync(`${pnpm} exec tsx src/db/seed.ts`, {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
  });
}
