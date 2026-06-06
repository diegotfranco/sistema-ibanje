import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    pool: 'forks',
    fileParallelism: false,
    globalSetup: ['./test/global-setup.ts'],
    setupFiles: ['./test/setup-env.ts'],
    include: ['test/**/*.test.ts'],
    testTimeout: 20000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      // text → console summary; lcov → consumed by the SonarCloud scan (sonar-project.properties).
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      // Exclude wiring/boilerplate coverage can't meaningfully exercise (server bootstrap, the
      // schema/seed/migration data layer, and env config).
      exclude: ['src/db/**', 'src/config/**', 'src/app.ts', 'src/**/*.d.ts'],
      // Enforce the agreed floor: `pnpm test:coverage` fails below this. Gated on lines (the headline
      // metric; currently ~76%). Branches/functions trail and are left ungated so normal fluctuation
      // doesn't break CI.
      thresholds: { lines: 70 }
    }
  }
});
