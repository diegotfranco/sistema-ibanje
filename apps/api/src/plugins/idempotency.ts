import type { FastifyInstance } from 'fastify';
import { getRedis } from '../lib/redis.js';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const CACHE_TTL_SECONDS = 24 * 60 * 60;
const LOCK_TTL_SECONDS = 30;

type CachedResponse = { status: number; body: string; contentType: string };

declare module 'fastify' {
  interface FastifyRequest {
    _idemCacheKey?: string;
    _idemLockKey?: string;
  }
}

export async function registerIdempotencyPlugin(app: FastifyInstance) {
  const redis = await getRedis();

  app.addHook('preHandler', async (req, reply) => {
    if (!WRITE_METHODS.has(req.method)) return;

    const key = req.headers['idempotency-key'];
    if (typeof key !== 'string' || key.length === 0) return;

    const userPart = req.session?.userId ?? 'anon';
    const routePart = req.url;
    const cacheKey = `idem:${userPart}:${routePart}:${key}`;
    const lockKey = `${cacheKey}:lock`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as CachedResponse;
      reply.header('Idempotent-Replay', 'true');
      reply.type(parsed.contentType);
      return reply.code(parsed.status).send(parsed.body);
    }

    const acquired = await redis.set(lockKey, '1', { NX: true, EX: LOCK_TTL_SECONDS });
    if (acquired === null) {
      return reply.code(409).send({ message: 'Request already in progress' });
    }

    // Stash for the onSend hook
    req._idemCacheKey = cacheKey;
    req._idemLockKey = lockKey;
  });

  app.addHook('onSend', async (req, reply, payload) => {
    const cacheKey = req._idemCacheKey;
    const lockKey = req._idemLockKey;
    if (!cacheKey || !lockKey) return payload;

    const status = reply.statusCode;
    if (status >= 200 && status < 300) {
      const bodyStr =
        typeof payload === 'string'
          ? payload
          : payload instanceof Buffer
            ? payload.toString('utf8')
            : '';
      const contentType = reply.getHeader('content-type')?.toString() ?? 'application/json';
      const cached: CachedResponse = { status, body: bodyStr, contentType };
      await redis.set(cacheKey, JSON.stringify(cached), { EX: CACHE_TTL_SECONDS });
    } else {
      await redis.del(lockKey);
    }
    return payload;
  });
}
