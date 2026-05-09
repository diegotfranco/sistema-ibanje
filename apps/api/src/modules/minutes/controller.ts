import { FastifyRequest, FastifyReply } from 'fastify';
import type {
  CreateMinuteRequest,
  UpdateMinuteVersionRequest,
  EditApprovedMinuteRequest,
  ApproveMinuteRequest
} from './schema.js';
import type { IdParam } from '../../lib/validation.js';
import type { PaginationQuery } from '../../lib/pagination.js';
import { logAudit } from '../../lib/audit.js';
import * as service from './service.js';

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const { page, limit } = req.query as PaginationQuery;
  return reply.send(await service.listMinutes(req.session.userId!, page, limit));
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const minute = await service.getMinuteById(id);
  if (!minute) return reply.code(404).send({ message: 'Minute not found' });
  return reply.send(minute);
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as CreateMinuteRequest;
  const minute = await service.createMinute(req.session.userId!, body);
  logAudit(req.session.userId!, 'create', 'minute', minute.id, { ipAddress: req.ip });
  return reply.code(201).send(minute);
}

export async function updatePending(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as UpdateMinuteVersionRequest;
  const minute = await service.updatePendingVersion(req.session.userId!, id, body);
  if (!minute) return reply.code(404).send({ message: 'Minute not found' });
  return reply.send(minute);
}

export async function editApproved(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as EditApprovedMinuteRequest;
  const minute = await service.editApprovedMinute(req.session.userId!, id, body);
  if (!minute) return reply.code(404).send({ message: 'Minute not found' });
  logAudit(req.session.userId!, 'state_change', 'minute', id, {
    notes: 'new version',
    ipAddress: req.ip
  });
  return reply.send(minute);
}

export async function approve(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as ApproveMinuteRequest;
  const minute = await service.approveMinute(req.session.userId!, id, body);
  if (!minute) return reply.code(404).send({ message: 'Minute not found' });
  logAudit(req.session.userId!, 'state_change', 'minute', id, {
    notes: 'aprovada',
    ipAddress: req.ip
  });
  return reply.send(minute);
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const result = await service.deleteMinute(req.session.userId!, id);
  if (result === null) return reply.code(404).send({ message: 'Minute not found' });
  logAudit(req.session.userId!, 'delete', 'minute', id, { ipAddress: req.ip });
  return reply.code(204).send();
}
