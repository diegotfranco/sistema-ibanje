import { FastifyInstance } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import { RedisStore } from 'connect-redis';
import { env } from '../config/env.js';
import { getRedis, closeRedis } from '../lib/redis.js';

declare module '@fastify/session' {
  interface FastifySessionObject {
    userId?: number;
  }
}

export async function registerSessionPlugin(app: FastifyInstance) {
  const redisClient = await getRedis();

  app.addHook('onClose', async () => {
    await closeRedis();
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
