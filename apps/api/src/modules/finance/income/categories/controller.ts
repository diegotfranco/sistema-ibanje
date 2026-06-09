import { FastifyRequest, FastifyReply } from 'fastify';
import type {
  CreateIncomeCategoryRequest,
  UpdateIncomeCategoryRequest,
  ListIncomeCategoriesRequest
} from './schema.js';
import type { IdParam } from '../../../../lib/validation.js';
import * as service from './service.js';

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const { page, limit, q, deleted } = req.query as ListIncomeCategoriesRequest;
  return reply.send(
    await service.listIncomeCategories(req.session.userId!, page, limit, q, deleted)
  );
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const category = await service.getIncomeCategoryById(id);
  if (!category) return reply.code(404).send({ message: 'Income category not found' });
  return reply.send(category);
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as CreateIncomeCategoryRequest;
  return reply.code(201).send(await service.createIncomeCategory(req.session.userId!, body));
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as UpdateIncomeCategoryRequest;
  const category = await service.updateIncomeCategory(req.session.userId!, id, body);
  if (!category) return reply.code(404).send({ message: 'Income category not found' });
  return reply.send(category);
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const result = await service.softDeleteIncomeCategory(req.session.userId!, id);
  if (result === null) return reply.code(404).send({ message: 'Income category not found' });
  return reply.code(204).send();
}

export async function restore(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const category = await service.restoreIncomeCategory(req.session.userId!, id);
  if (!category) return reply.code(404).send({ message: 'Income category not found' });
  return reply.send(category);
}
