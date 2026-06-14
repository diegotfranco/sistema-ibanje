// Loaded by Vitest as setupFile (per-file, runs before user code).
// global-setup.ts runs once before everything; this just guarantees env in each worker.
process.env.NODE_ENV = 'test';

import { afterAll, vi } from 'vitest';

// Stub the Resend SDK suite-wide so no test makes a real network call to the email provider. CI
// sets a placeholder RESEND_API_KEY (re_test) that Resend rejects, which would otherwise turn every
// invite/approval send into a 502 (the admin create/approve paths surface a failed send as 502).
// The `send` is a successful no-op by default; tests that need to inspect the payload (email.test.ts,
// church-settings-logo.test.ts) declare their own in-file vi.mock with a capturing spy, which
// re-registers and takes precedence for that file.
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: vi.fn().mockResolvedValue({ data: { id: 'test-email' }, error: null }) };
  }
}));

// Per-fork teardown: close the shared Fastify app (fires its onClose hook → closeRedis)
// and end the postgres pool, so no open sockets keep the Vitest process alive.
//
// The app/db modules are imported DYNAMICALLY (not via static `import`) on purpose: static
// imports hoist above the `NODE_ENV = 'test'` line, which would load src/app.js while NODE_ENV
// is still unset and trip its top-level `if (env.NODE_ENV !== 'test')` server-boot guard,
// starting a real listening server that never closes. By teardown time NODE_ENV is 'test'.
afterAll(async () => {
  const { closeTestApp } = await import('./helpers/app.js');
  const { sql } = await import('../src/db/index.js');
  await closeTestApp(); // app.close() → onClose → closeRedis(); no-op if app was never built
  await sql.end({ timeout: 5 }); // close postgres.js pool; resolves immediately if never queried
});
