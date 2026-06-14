import { FastifyRequest, FastifyReply } from 'fastify';
import type {
  CreateIncomeEntryRequest,
  UpdateIncomeEntryRequest,
  IncomeSummaryQuery
} from './schema.js';
import type { IdParam } from '../../../../lib/validation.js';
import type { PaginationQuery } from '../../../../lib/pagination.js';
import { logAudit } from '../../../../lib/audit.js';
import * as service from './service.js';

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const { page, limit } = req.query as PaginationQuery;
  return reply.send(await service.listIncomeEntries(req.session.userId!, page, limit));
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const entry = await service.getIncomeEntryById(id);
  if (!entry) return reply.code(404).send({ message: 'Income entry not found' });
  return reply.send(entry);
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as CreateIncomeEntryRequest;
  const entry = await service.createIncomeEntry(req.session.userId!, body);
  logAudit(req.session.userId!, 'create', 'income_entry', entry.id, { ipAddress: req.ip });
  return reply.code(201).send(entry);
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as UpdateIncomeEntryRequest;
  const entry = await service.updateIncomeEntry(req.session.userId!, id, body);
  if (!entry) return reply.code(404).send({ message: 'Income entry not found' });
  logAudit(req.session.userId!, 'update', 'income_entry', id, { ipAddress: req.ip });
  return reply.send(entry);
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const result = await service.cancelIncomeEntry(req.session.userId!, id);
  if (result === null) return reply.code(404).send({ message: 'Income entry not found' });
  // Finance entries are voided (status → cancelada), never hard-deleted, so this is a state change.
  logAudit(req.session.userId!, 'state_change', 'income_entry', id, {
    notes: 'cancelada',
    ipAddress: req.ip
  });
  return reply.code(204).send();
}

export async function summary(req: FastifyRequest, reply: FastifyReply) {
  const query = req.query as IncomeSummaryQuery;
  return reply.send(await service.summarizeIncome(req.session.userId!, query));
}
