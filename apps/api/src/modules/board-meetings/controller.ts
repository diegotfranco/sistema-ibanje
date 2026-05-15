import { FastifyRequest, FastifyReply } from 'fastify';
import type {
  CreateBoardMeetingRequest,
  UpdateBoardMeetingRequest,
  SetAgendaItemsRequest
} from './schema.js';
import type { IdParam } from '../../lib/validation.js';
import type { PaginationQuery } from '../../lib/pagination.js';
import * as service from './service.js';

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const { page, limit } = req.query as PaginationQuery;
  return reply.send(await service.listBoardMeetings(req.session.userId!, page, limit));
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const meeting = await service.getBoardMeetingById(id);
  if (!meeting) return reply.code(404).send({ message: 'Board meeting not found' });
  return reply.send(meeting);
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as CreateBoardMeetingRequest;
  const meeting = await service.createBoardMeeting(req.session.userId!, body);
  return reply.code(201).send(meeting);
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as UpdateBoardMeetingRequest;
  const meeting = await service.updateBoardMeeting(req.session.userId!, id, body);
  if (!meeting) return reply.code(404).send({ message: 'Board meeting not found' });
  return reply.send(meeting);
}

export async function setAgendaItems(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as SetAgendaItemsRequest;
  const meeting = await service.setAgendaItems(req.session.userId!, id, body);
  if (!meeting) return reply.code(404).send({ message: 'Board meeting not found' });
  return reply.send(meeting);
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const result = await service.deactivateBoardMeeting(req.session.userId!, id);
  if (result === null) return reply.code(404).send({ message: 'Board meeting not found' });
  return reply.code(204).send();
}
