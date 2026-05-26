import { FastifyRequest, FastifyReply } from 'fastify';
import type { z } from 'zod';
import { MonthQueryRequestSchema } from './schema.js';
import * as service from './service.js';

type MonthQuery = z.infer<typeof MonthQueryRequestSchema>;

export async function getDashboard(req: FastifyRequest, reply: FastifyReply) {
  const { month } = req.query as MonthQuery;
  return reply.send(await service.getDashboard(req.session.userId!, month));
}
