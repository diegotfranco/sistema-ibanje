import { FastifyRequest, FastifyReply } from 'fastify';
import type { CreateEventRequest, UpdateEventRequest, ListEventsRequest } from './schema.js';
import type { IdParam } from '../../lib/validation.js';
import * as service from './service.js';

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const { page, limit, status } = req.query as ListEventsRequest;
  return reply.send(await service.listEvents(req.session.userId!, page, limit, status));
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const event = await service.getEventById(req.session.userId!, id);
  if (!event) return reply.code(404).send({ message: 'Event not found' });
  return reply.send(event);
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as CreateEventRequest;
  const event = await service.createEvent(req.session.userId!, body);
  return reply.code(201).send(event);
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as UpdateEventRequest;
  const event = await service.updateEvent(req.session.userId!, id, body);
  if (!event) return reply.code(404).send({ message: 'Event not found' });
  return reply.send(event);
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const result = await service.deactivateEvent(req.session.userId!, id);
  if (result === null) return reply.code(404).send({ message: 'Event not found' });
  return reply.code(204).send();
}
