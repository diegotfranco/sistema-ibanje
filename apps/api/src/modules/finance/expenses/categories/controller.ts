import { FastifyRequest, FastifyReply } from 'fastify';
import type { CreateExpenseCategoryRequest, UpdateExpenseCategoryRequest } from './schema';
import type { IdParam } from '../../../../lib/validation';
import type { PaginationQuery } from '../../../../lib/pagination';
import * as service from './service';

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const { page, limit } = req.query as PaginationQuery;
  return reply.send(await service.listExpenseCategories(req.session.userId!, page, limit));
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const category = await service.getExpenseCategoryById(id);
  if (!category) return reply.code(404).send({ message: 'Expense category not found' });
  return reply.send(category);
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as CreateExpenseCategoryRequest;
  return reply.code(201).send(await service.createExpenseCategory(req.session.userId!, body));
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as UpdateExpenseCategoryRequest;
  const category = await service.updateExpenseCategory(req.session.userId!, id, body);
  if (!category) return reply.code(404).send({ message: 'Expense category not found' });
  return reply.send(category);
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const result = await service.deactivateExpenseCategory(req.session.userId!, id);
  if (result === null) return reply.code(404).send({ message: 'Expense category not found' });
  return reply.code(204).send();
}
