import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { env } from './config/env';
import { sql } from './db';
import { registerSwaggerPlugin } from './plugins/swagger';
import { registerSessionPlugin } from './plugins/session';
import { registerRateLimitPlugin } from './plugins/rateLimit';
import { registerCsrfPlugin } from './plugins/csrf';
import { registerErrorHandler } from './plugins/errorHandler';
import { registerRoutes } from './modules/index';
import { initStorage } from './lib/storage';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined
    }
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });
  await registerSwaggerPlugin(app);
  await registerSessionPlugin(app);
  await registerRateLimitPlugin(app);
  await registerCsrfPlugin(app);
  await initStorage();

  registerErrorHandler(app);

  await registerRoutes(app);

  return app;
}

async function start() {
  const app = await buildApp();

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, 'shutdown signal received');
    const gracePeriod = env.NODE_ENV === 'development' ? 1000 : 10_000;
    setTimeout(() => process.exit(1), gracePeriod).unref();
    try {
      await app.close();
      await sql.end();
    } finally {
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
