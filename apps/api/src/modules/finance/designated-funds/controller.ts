import { FastifyRequest, FastifyReply } from 'fastify';
import type { CreateDesignatedFundRequest, UpdateDesignatedFundRequest } from './schema.js';
import type { IdParam } from '../../../lib/validation.js';
import type { PaginationQuery } from '../../../lib/pagination.js';
import * as service from './service.js';

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const { page, limit } = req.query as PaginationQuery;
  return reply.send(await service.listDesignatedFunds(req.session.userId!, page, limit));
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const fund = await service.getDesignatedFundById(id);
  if (!fund) return reply.code(404).send({ message: 'Designated fund not found' });
  return reply.send(fund);
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as CreateDesignatedFundRequest;
  return reply.code(201).send(await service.createDesignatedFund(req.session.userId!, body));
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as UpdateDesignatedFundRequest;
  const fund = await service.updateDesignatedFund(req.session.userId!, id, body);
  if (!fund) return reply.code(404).send({ message: 'Designated fund not found' });
  return reply.send(fund);
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const result = await service.deactivateDesignatedFund(req.session.userId!, id);
  if (result === null) return reply.code(404).send({ message: 'Designated fund not found' });
  return reply.code(204).send();
}
