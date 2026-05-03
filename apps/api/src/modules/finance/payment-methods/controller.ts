import { FastifyRequest, FastifyReply } from 'fastify';
import {
  ListPaymentMethodsRequestSchema,
  CreatePaymentMethodRequestSchema,
  UpdatePaymentMethodRequestSchema
} from './schema';
import * as service from './service';
import { IdParamSchema } from '../../../lib/validation';

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const query = ListPaymentMethodsRequestSchema.parse(req.query);
  return reply.send(await service.listPaymentMethods(req.session.userId!, query.page, query.limit));
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const pm = await service.getPaymentMethodById(id);
  if (!pm) return reply.code(404).send({ message: 'Payment method not found' });
  return reply.send(pm);
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const body = CreatePaymentMethodRequestSchema.parse(req.body);
  return reply.code(201).send(await service.createPaymentMethod(req.session.userId!, body));
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const body = UpdatePaymentMethodRequestSchema.parse(req.body);
  const pm = await service.updatePaymentMethod(req.session.userId!, id, body);
  if (!pm) return reply.code(404).send({ message: 'Payment method not found' });
  return reply.send(pm);
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const result = await service.deactivatePaymentMethod(req.session.userId!, id);
  if (result === null) return reply.code(404).send({ message: 'Payment method not found' });
  return reply.code(204).send();
}
