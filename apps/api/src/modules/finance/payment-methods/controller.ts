import { FastifyRequest, FastifyReply } from 'fastify';
import type { CreatePaymentMethodRequest, UpdatePaymentMethodRequest } from './schema.js';
import type { IdParam } from '../../../lib/validation.js';
import type { PaginationQuery } from '../../../lib/pagination.js';
import type { DeletedFilter } from '../../../lib/softDelete.js';
import * as service from './service.js';

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const { page, limit, deleted } = req.query as PaginationQuery & { deleted?: DeletedFilter };
  return reply.send(await service.listPaymentMethods(req.session.userId!, page, limit, deleted));
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const pm = await service.getPaymentMethodById(id);
  if (!pm) return reply.code(404).send({ message: 'Payment method not found' });
  return reply.send(pm);
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as CreatePaymentMethodRequest;
  return reply.code(201).send(await service.createPaymentMethod(req.session.userId!, body));
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as UpdatePaymentMethodRequest;
  const pm = await service.updatePaymentMethod(req.session.userId!, id, body);
  if (!pm) return reply.code(404).send({ message: 'Payment method not found' });
  return reply.send(pm);
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const result = await service.softDeletePaymentMethod(req.session.userId!, id);
  if (result === null) return reply.code(404).send({ message: 'Payment method not found' });
  return reply.code(204).send();
}

export async function restore(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const pm = await service.restorePaymentMethod(req.session.userId!, id);
  if (!pm) return reply.code(404).send({ message: 'Payment method not found' });
  return reply.send(pm);
}
