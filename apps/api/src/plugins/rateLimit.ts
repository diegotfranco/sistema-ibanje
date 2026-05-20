import { FastifyInstance } from 'fastify';
import fastifyRateLimit from '@fastify/rate-limit';

// Server binds to 0.0.0.0 (apps/api/src/app.ts), so the IPv4-mapped IPv6
// form (::ffff:127.0.0.1) can never appear on req.ip — only listed if we
// ever switch the bind to a dual-stack IPv6 socket (::).
const LOOPBACK_IPS = new Set(['127.0.0.1', '::1']);

export async function registerRateLimitPlugin(app: FastifyInstance) {
  await app.register(fastifyRateLimit, {
    global: false, // opt-in per route, not applied globally
    allowList: (req) => LOOPBACK_IPS.has(req.ip)
  });
}
