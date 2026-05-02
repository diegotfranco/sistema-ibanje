import { FastifyInstance } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';
import { env } from '../config/env';

declare module '@fastify/session' {
  interface FastifySessionObject {
    userId?: number;
  }
}

export async function registerSessionPlugin(app: FastifyInstance) {
  const redisClient = createClient({ url: env.REDIS_URL });
  await redisClient.connect();

  app.addHook('onClose', async () => {
    await redisClient.quit();
  });

  const store = new RedisStore({ client: redisClient });

  await app.register(fastifyCookie);
  await app.register(fastifySession, {
    secret: env.SESSION_SECRET,
    store,
    cookie: {
      secure: env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax'
    },
    saveUninitialized: false
  });
}
