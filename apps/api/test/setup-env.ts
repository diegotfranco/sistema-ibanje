// Loaded by Vitest as setupFile (per-file, runs before user code).
// global-setup.ts runs once before everything; this just guarantees env in each worker.
process.env.NODE_ENV = 'test';

import { afterAll } from 'vitest';

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
