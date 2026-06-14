import { FastifyRequest, FastifyReply } from 'fastify';
import type { ListAuditRequest } from './schema.js';
import * as service from './service.js';

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const query = req.query as ListAuditRequest;
  return reply.send(await service.listAudit(req.session.userId!, query));
}
