import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { env } from './config/env';
import { sql } from './db';
import { registerSwaggerPlugin } from './plugins/swagger';
import { registerSessionPlugin } from './plugins/session';
import { registerRateLimitPlugin } from './plugins/rateLimit';
import { registerCsrfPlugin } from './plugins/csrf';
import { registerErrorHandler } from './plugins/errorHandler';
import { registerRoutes } from './modules/index';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined
    }
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await registerSwaggerPlugin(app);
  await registerSessionPlugin(app);
  await registerRateLimitPlugin(app);
  await registerCsrfPlugin(app);

  registerErrorHandler(app);

  await registerRoutes(app);

  return app;
}

async function start() {
  const app = await buildApp();

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, 'shutdown signal received');
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
