import { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { env } from '../config/env.js';

export async function registerCorsPlugin(app: FastifyInstance) {
  await app.register(cors, {
    origin: [env.CORS_ORIGIN, env.CORS_ORIGIN.replace('localhost', '127.0.0.1')],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-csrf-token', 'Idempotency-Key']
  });
}
