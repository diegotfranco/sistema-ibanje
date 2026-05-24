import { FastifyRequest, FastifyReply } from 'fastify';
import type { z } from 'zod';
import {
  ListMonthlyClosingsRequestSchema,
  type CreateMonthlyClosingRequest,
  type SubmitMonthlyClosingRequest,
  type ApproveMonthlyClosingRequest,
  type RejectMonthlyClosingRequest,
  type ReproveClosingRequest
} from './schema.js';
import type { IdParam } from '../../../lib/validation.js';
import { logAudit } from '../../../lib/audit.js';
import * as service from './service.js';

type ListMonthlyClosingsQuery = z.infer<typeof ListMonthlyClosingsRequestSchema>;

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const { page, limit, year } = req.query as ListMonthlyClosingsQuery;
  return reply.send(await service.listMonthlyClosings(req.session.userId!, page, limit, year));
}

export async function listYears(req: FastifyRequest, reply: FastifyReply) {
  const years = await service.listMonthlyClosingYears(req.session.userId!);
  return reply.send({ years });
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const closing = await service.getMonthlyClosingById(id);
  if (!closing) return reply.code(404).send({ message: 'Monthly closing not found' });
  return reply.send(closing);
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as CreateMonthlyClosingRequest;
  const closing = await service.createMonthlyClosing(req.session.userId!, body);
  logAudit(req.session.userId!, 'create', 'monthly_closing', closing.id, { ipAddress: req.ip });
  return reply.code(201).send(closing);
}

export async function submit(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as SubmitMonthlyClosingRequest;
  const closing = await service.submitMonthlyClosing(req.session.userId!, id, body);
  logAudit(req.session.userId!, 'state_change', 'monthly_closing', id, {
    notes: 'em revisão',
    ipAddress: req.ip
  });
  return reply.send(closing);
}

export async function approve(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as ApproveMonthlyClosingRequest;
  const closing = await service.approveMonthlyClosing(req.session.userId!, id, body);
  logAudit(req.session.userId!, 'state_change', 'monthly_closing', id, {
    notes: 'aprovado',
    ipAddress: req.ip
  });
  return reply.send(closing);
}

export async function reject(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as RejectMonthlyClosingRequest;
  const closing = await service.rejectMonthlyClosing(req.session.userId!, id, body);
  logAudit(req.session.userId!, 'state_change', 'monthly_closing', id, {
    notes: 'aberto',
    ipAddress: req.ip
  });
  return reply.send(closing);
}

export async function reprove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as ReproveClosingRequest;
  const closing = await service.reproveApprovedClosing(req.session.userId!, id);
  logAudit(req.session.userId!, 'state_change', 'monthly_closing', id, {
    notes: body.reason,
    ipAddress: req.ip
  });
  return reply.send(closing);
}

export async function close(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const closing = await service.closeMonthlyClosing(req.session.userId!, id);
  logAudit(req.session.userId!, 'state_change', 'monthly_closing', id, {
    notes: 'fechado',
    ipAddress: req.ip
  });
  return reply.send(closing);
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const result = await service.deleteMonthlyClosing(req.session.userId!, id);
  if (result === null) return reply.code(404).send({ message: 'Monthly closing not found' });
  logAudit(req.session.userId!, 'delete', 'monthly_closing', id, { ipAddress: req.ip });
  return reply.code(204).send();
}
