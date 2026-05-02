import { FastifyRequest, FastifyReply } from 'fastify';
import {
  ListExpenseCategoriesRequestSchema,
  CreateExpenseCategoryRequestSchema,
  UpdateExpenseCategoryRequestSchema
} from './schema.js';
import * as service from './service.js';
import { IdParamSchema } from '../../../lib/validation.js';

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const query = ListExpenseCategoriesRequestSchema.parse(req.query);
  return reply.send(await service.listExpenseCategories(req.session.userId!, query.page, query.limit));
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const category = await service.getExpenseCategoryById(id);
  if (!category) return reply.code(404).send({ message: 'Expense category not found' });
  return reply.send(category);
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const body = CreateExpenseCategoryRequestSchema.parse(req.body);
  return reply.code(201).send(await service.createExpenseCategory(req.session.userId!, body));
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const body = UpdateExpenseCategoryRequestSchema.parse(req.body);
  const category = await service.updateExpenseCategory(req.session.userId!, id, body);
  if (!category) return reply.code(404).send({ message: 'Expense category not found' });
  return reply.send(category);
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const result = await service.deactivateExpenseCategory(req.session.userId!, id);
  if (result === null) return reply.code(404).send({ message: 'Expense category not found' });
  return reply.code(204).send();
}
