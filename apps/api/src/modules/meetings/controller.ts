import { FastifyRequest, FastifyReply } from 'fastify';
import type {
  CreateMeetingRequest,
  UpdateMeetingRequest,
  SetAgendaItemsRequest
} from './schema.js';
import type { IdParam } from '../../lib/validation.js';
import type { PaginationQuery } from '../../lib/pagination.js';
import * as service from './service.js';

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const { page, limit } = req.query as PaginationQuery;
  return reply.send(await service.listMeetings(req.session.userId!, page, limit));
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const meeting = await service.getMeetingById(id);
  if (!meeting) return reply.code(404).send({ message: 'Meeting not found' });
  return reply.send(meeting);
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as CreateMeetingRequest;
  const meeting = await service.createMeeting(req.session.userId!, body);
  return reply.code(201).send(meeting);
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as UpdateMeetingRequest;
  const meeting = await service.updateMeeting(req.session.userId!, id, body);
  if (!meeting) return reply.code(404).send({ message: 'Meeting not found' });
  return reply.send(meeting);
}

export async function setAgendaItems(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as SetAgendaItemsRequest;
  const meeting = await service.setAgendaItems(req.session.userId!, id, body);
  if (!meeting) return reply.code(404).send({ message: 'Meeting not found' });
  return reply.send(meeting);
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const result = await service.deactivateMeeting(req.session.userId!, id);
  if (result === null) return reply.code(404).send({ message: 'Meeting not found' });
  return reply.code(204).send();
}
