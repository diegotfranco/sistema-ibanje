import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';

let app: FastifyInstance | null = null;

export async function getTestApp(): Promise<FastifyInstance> {
  if (!app) {
    app = await buildApp();
    await app.ready();
  }
  return app;
}

export async function closeTestApp() {
  if (app) {
    await app.close();
    app = null;
  }
}
