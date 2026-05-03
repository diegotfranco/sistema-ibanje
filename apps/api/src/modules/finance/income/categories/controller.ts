import { FastifyRequest, FastifyReply } from 'fastify';
import {
  ListIncomeCategoriesRequestSchema,
  CreateIncomeCategoryRequestSchema,
  UpdateIncomeCategoryRequestSchema
} from './schema';
import * as service from './service';
import { IdParamSchema } from '../../../../lib/validation';

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const query = ListIncomeCategoriesRequestSchema.parse(req.query);
  return reply.send(await service.listIncomeCategories(req.session.userId!, query.page, query.limit));
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const category = await service.getIncomeCategoryById(id);
  if (!category) return reply.code(404).send({ message: 'Income category not found' });
  return reply.send(category);
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const body = CreateIncomeCategoryRequestSchema.parse(req.body);
  return reply.code(201).send(await service.createIncomeCategory(req.session.userId!, body));
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const body = UpdateIncomeCategoryRequestSchema.parse(req.body);
  const category = await service.updateIncomeCategory(req.session.userId!, id, body);
  if (!category) return reply.code(404).send({ message: 'Income category not found' });
  return reply.send(category);
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const result = await service.deactivateIncomeCategory(req.session.userId!, id);
  if (result === null) return reply.code(404).send({ message: 'Income category not found' });
  return reply.code(204).send();
}
