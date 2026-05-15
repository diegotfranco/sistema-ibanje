import { FastifyRequest, FastifyReply } from 'fastify';
import type {
  CreateMinuteRequest,
  UpdateMinuteVersionRequest,
  UpdateMinuteRequest,
  EditApprovedMinuteRequest,
  ApproveMinuteRequest,
  UpdateMinuteTemplateRequest
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

export async function finalizeDraft(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const minute = await service.finalizeDraft(req.session.userId!, id);
  if (!minute) return reply.code(404).send({ message: 'Minute not found' });
  logAudit(req.session.userId!, 'state_change', 'minute', id, {
    notes: 'finalized draft',
    ipAddress: req.ip
  });
  return reply.send(minute);
}

export async function sign(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const file = await req.file();
  if (!file) return reply.code(400).send({ message: 'No file uploaded' });

  const buffer = await file.toBuffer();
  const minute = await service.signMinute(req.session.userId!, id, buffer, file.mimetype);
  if (!minute) return reply.code(404).send({ message: 'Minute not found' });
  logAudit(req.session.userId!, 'state_change', 'minute', id, {
    notes: 'signed PDF',
    ipAddress: req.ip
  });
  return reply.send(minute);
}

export async function updateMinute(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as UpdateMinuteRequest;
  const minute = await service.updateMinute(req.session.userId!, id, body);
  if (!minute) return reply.code(404).send({ message: 'Minute not found' });
  logAudit(req.session.userId!, 'update', 'minute', id, { ipAddress: req.ip });
  return reply.send(minute);
}

export async function listMinuteTemplates(req: FastifyRequest, reply: FastifyReply) {
  const templates = await service.listMinuteTemplates();
  return reply.send(templates);
}

export async function getMinuteTemplate(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const template = await service.getMinuteTemplateById(id);
  if (!template) return reply.code(404).send({ message: 'Template not found' });
  return reply.send(template);
}

export async function updateMinuteTemplate(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as UpdateMinuteTemplateRequest;
  const template = await service.updateMinuteTemplate(req.session.userId!, id, body);
  if (!template) return reply.code(404).send({ message: 'Template not found' });
  logAudit(req.session.userId!, 'update', 'minute_template', id, { ipAddress: req.ip });
  return reply.send(template);
}
