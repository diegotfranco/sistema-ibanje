import { FastifyInstance } from 'fastify';
import fastifyRateLimit from '@fastify/rate-limit';

const LOOPBACK_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

export async function registerRateLimitPlugin(app: FastifyInstance) {
  await app.register(fastifyRateLimit, {
    global: false, // opt-in per route, not applied globally
    allowList: (req) => LOOPBACK_IPS.has(req.ip)
  });
}
