import { FastifyRequest, FastifyReply } from 'fastify';
import type { CreateExpenseEntryRequest, UpdateExpenseEntryRequest } from './schema';
import type { IdParam } from '../../../../lib/validation';
import type { PaginationQuery } from '../../../../lib/pagination';
import * as service from './service';

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const { page, limit } = req.query as PaginationQuery;
  return reply.send(await service.listExpenseEntries(req.session.userId!, page, limit));
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const entry = await service.getExpenseEntryById(id);
  if (!entry) return reply.code(404).send({ message: 'Expense entry not found' });
  return reply.send(entry);
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as CreateExpenseEntryRequest;
  return reply.code(201).send(await service.createExpenseEntry(req.session.userId!, body));
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as UpdateExpenseEntryRequest;
  const entry = await service.updateExpenseEntry(req.session.userId!, id, body);
  if (!entry) return reply.code(404).send({ message: 'Expense entry not found' });
  return reply.send(entry);
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const result = await service.cancelExpenseEntry(req.session.userId!, id);
  if (result === null) return reply.code(404).send({ message: 'Expense entry not found' });
  return reply.code(204).send();
}
