import { FastifyRequest, FastifyReply } from 'fastify';
import type {
  CreateCalendarEntryRequest,
  UpdateCalendarEntryRequest,
  ListCalendarEntriesRequest,
  CalendarFeedQuery
} from './schema.js';
import type { IdParam } from '../../lib/validation.js';
import * as service from './service.js';

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const { page, limit, status } = req.query as ListCalendarEntriesRequest;
  return reply.send(await service.listCalendarEntries(req.session.userId!, page, limit, status));
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const entry = await service.getCalendarEntryById(req.session.userId!, id);
  if (!entry) return reply.code(404).send({ message: 'Calendar entry not found' });
  return reply.send(entry);
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as CreateCalendarEntryRequest;
  const entry = await service.createCalendarEntry(req.session.userId!, body);
  return reply.code(201).send(entry);
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as UpdateCalendarEntryRequest;
  const entry = await service.updateCalendarEntry(req.session.userId!, id, body);
  if (!entry) return reply.code(404).send({ message: 'Calendar entry not found' });
  return reply.send(entry);
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const result = await service.deactivateCalendarEntry(req.session.userId!, id);
  if (result === null) return reply.code(404).send({ message: 'Calendar entry not found' });
  return reply.code(204).send();
}

export async function feed(req: FastifyRequest, reply: FastifyReply) {
  const { from, to } = req.query as CalendarFeedQuery;
  return reply.send(await service.getFeed(from, to));
}
