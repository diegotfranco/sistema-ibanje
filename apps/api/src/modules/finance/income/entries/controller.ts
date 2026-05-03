import { FastifyRequest, FastifyReply } from 'fastify';
import {
  ListIncomeEntriesRequestSchema,
  CreateIncomeEntryRequestSchema,
  UpdateIncomeEntryRequestSchema
} from './schema';
import * as service from './service';
import { IdParamSchema } from '../../../../lib/validation';

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const query = ListIncomeEntriesRequestSchema.parse(req.query);
  return reply.send(await service.listIncomeEntries(req.session.userId!, query.page, query.limit));
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const entry = await service.getIncomeEntryById(id);
  if (!entry) return reply.code(404).send({ message: 'Income entry not found' });
  return reply.send(entry);
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const body = CreateIncomeEntryRequestSchema.parse(req.body);
  return reply.code(201).send(await service.createIncomeEntry(req.session.userId!, body));
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const body = UpdateIncomeEntryRequestSchema.parse(req.body);
  const entry = await service.updateIncomeEntry(req.session.userId!, id, body);
  if (!entry) return reply.code(404).send({ message: 'Income entry not found' });
  return reply.send(entry);
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const result = await service.cancelIncomeEntry(req.session.userId!, id);
  if (result === null) return reply.code(404).send({ message: 'Income entry not found' });
  return reply.code(204).send();
}
