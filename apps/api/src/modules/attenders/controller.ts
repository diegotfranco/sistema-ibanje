import { FastifyRequest, FastifyReply } from 'fastify';
import type { CreateAttenderRequest, UpdateAttenderRequest } from './schema.js';
import type { IdParam } from '../../lib/validation.js';
import type { PaginationQuery } from '../../lib/pagination.js';
import { logAudit } from '../../lib/audit.js';
import * as service from './service.js';

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const { page, limit } = req.query as PaginationQuery;
  return reply.send(await service.listAttenders(req.session.userId!, page, limit));
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const attender = await service.getAttenderById(id);
  if (!attender) return reply.code(404).send({ message: 'Attender not found' });
  return reply.send(attender);
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as CreateAttenderRequest;
  const attender = await service.createAttender(req.session.userId!, body);
  logAudit(req.session.userId!, 'create', 'attender', attender.id, { ipAddress: req.ip });
  return reply.code(201).send(attender);
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as UpdateAttenderRequest;
  const attender = await service.updateAttender(req.session.userId!, id, body);
  if (!attender) return reply.code(404).send({ message: 'Attender not found' });
  logAudit(req.session.userId!, 'update', 'attender', id, { ipAddress: req.ip });
  return reply.send(attender);
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const result = await service.deactivateAttender(req.session.userId!, id);
  if (result === null) return reply.code(404).send({ message: 'Attender not found' });
  logAudit(req.session.userId!, 'delete', 'attender', id, { ipAddress: req.ip });
  return reply.code(204).send();
}

export async function listDonations(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const { page, limit } = req.query as PaginationQuery;
  return reply.send(await service.listAttenderDonations(req.session.userId!, id, page, limit));
}
