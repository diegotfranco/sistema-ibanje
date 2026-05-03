import { FastifyRequest, FastifyReply } from 'fastify';
import {
  ListExpenseEntriesRequestSchema,
  CreateExpenseEntryRequestSchema,
  UpdateExpenseEntryRequestSchema
} from './schema';
import * as service from './service';
import { IdParamSchema } from '../../../../lib/validation';

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const query = ListExpenseEntriesRequestSchema.parse(req.query);
  return reply.send(await service.listExpenseEntries(req.session.userId!, query.page, query.limit));
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const entry = await service.getExpenseEntryById(id);
  if (!entry) return reply.code(404).send({ message: 'Expense entry not found' });
  return reply.send(entry);
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const body = CreateExpenseEntryRequestSchema.parse(req.body);
  return reply.code(201).send(await service.createExpenseEntry(req.session.userId!, body));
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const body = UpdateExpenseEntryRequestSchema.parse(req.body);
  const entry = await service.updateExpenseEntry(req.session.userId!, id, body);
  if (!entry) return reply.code(404).send({ message: 'Expense entry not found' });
  return reply.send(entry);
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const result = await service.cancelExpenseEntry(req.session.userId!, id);
  if (result === null) return reply.code(404).send({ message: 'Expense entry not found' });
  return reply.code(204).send();
}
