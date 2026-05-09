import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    pool: 'forks',
    singleFork: true,
    globalSetup: ['./test/global-setup.ts'],
    setupFiles: ['./test/setup-env.ts'],
    include: ['test/**/*.test.ts'],
    testTimeout: 20000,
    hookTimeout: 30000
  }
});
