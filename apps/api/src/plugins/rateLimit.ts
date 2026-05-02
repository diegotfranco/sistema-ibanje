import { FastifyInstance } from 'fastify';
import fastifyRateLimit from '@fastify/rate-limit';

export async function registerRateLimitPlugin(app: FastifyInstance) {
  await app.register(fastifyRateLimit, {
    global: false // opt-in per route, not applied globally
  });
}
