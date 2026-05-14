import { execSync } from 'node:child_process';

export function reseedDb() {
  const pnpmBin = require.resolve('pnpm/bin/pnpm.cjs');
  execSync(`${pnpmBin} exec tsx src/db/seed.ts`, {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
  });
}
