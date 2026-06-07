import path from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Dedicated test config: jsdom + RTL. We intentionally skip the React Compiler babel preset used in
// vite.config.ts — tests exercise behavior, not the optimized build, and the plain react() plugin is
// faster and avoids compiler-specific transforms in the test environment.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // Absolute base URL so node's fetch (used by jsdom) and MSW can resolve/intercept requests;
    // a relative '/api' would fail node fetch's URL parser.
    env: { VITE_API_URL: 'http://localhost/api' },
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // Playwright specs live under tests/ — keep them out of the Vitest run.
    exclude: ['tests/**', 'node_modules/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      // Coverage is measured over code WE own and maintain. Excluded:
      //  - components/ui/** : vendored shadcn primitives (CLAUDE.md forbids editing them); exercised
      //    transitively by page tests, never a direct unit-test target.
      //  - **/routes.tsx, App.tsx, main.tsx : router/menu metadata + app bootstrap (config-as-code
      //    wiring, no business logic), mirroring the backend's db/config/app.ts exclusions.
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/test/**',
        'src/components/ui/**',
        'src/**/routes.tsx',
        'src/App.tsx',
        'src/main.tsx',
        'src/**/*.d.ts'
      ],
      // Enforce the agreed floors: a coverage run (`pnpm test:coverage`) fails below these. Lines is the
      // headline metric (currently ~71%). A branches floor (currently ~57%) is also gated so the lines
      // gate can't be "gamed" by adding code + a smoke render with no interaction/assertion depth.
      // Functions/statements trail and stay ungated so normal fluctuation doesn't break CI.
      thresholds: { lines: 70, branches: 55 }
    }
  }
});
