import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { env } from './config/env.js';
import { sql } from './db/index.js';
import { registerCorsPlugin } from './plugins/cors.js';
import { registerSwaggerPlugin } from './plugins/swagger.js';
import { registerSessionPlugin } from './plugins/session.js';
import { registerRateLimitPlugin } from './plugins/rateLimit.js';
import { registerCsrfPlugin } from './plugins/csrf.js';
import { registerIdempotencyPlugin } from './plugins/idempotency.js';
import { registerErrorHandler } from './plugins/errorHandler.js';
import { registerRoutes } from './modules/index.js';
import { initStorage } from './lib/storage.js';
import { closeRedis } from './lib/redis.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined
    },
    trustProxy: true,
    genReqId: (req) => {
      const inbound = req.headers['x-request-id'];
      if (typeof inbound === 'string' && inbound.length > 0 && inbound.length <= 128)
        return inbound;
      return randomUUID();
    }
  });

  app.addHook('onSend', async (req, reply) => {
    reply.header('x-request-id', req.id);
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await registerCorsPlugin(app);
  await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });
  await registerSwaggerPlugin(app);
  await registerSessionPlugin(app);
  await registerRateLimitPlugin(app);
  await registerCsrfPlugin(app);
  await registerIdempotencyPlugin(app);
  if (env.NODE_ENV !== 'test') {
    await initStorage();
  }

  registerErrorHandler(app);

  await registerRoutes(app);

  return app;
}

if (env.NODE_ENV !== 'test') {
  const app = await buildApp();

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, 'shutdown signal received');
    const gracePeriod = env.NODE_ENV === 'development' ? 1000 : 10_000;
    setTimeout(() => process.exit(1), gracePeriod).unref();
    try {
      await app.close();
      await sql.end();
      await closeRedis();
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
