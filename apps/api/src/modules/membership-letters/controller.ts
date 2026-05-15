import { FastifyRequest, FastifyReply } from 'fastify';
import type {
  CreateMembershipLetterRequest,
  UpdateMembershipLetterRequest
} from './schema.js';
import type { IdParam } from '../../lib/validation.js';
import type { PaginationQuery } from '../../lib/pagination.js';
import { logAudit } from '../../lib/audit.js';
import * as service from './service.js';

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const { page, limit, attenderId, type } = req.query as any;
  return reply.send(
    await service.listMembershipLetters(req.session.userId!, page, limit, attenderId, type)
  );
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const letter = await service.getMembershipLetterById(id);
  if (!letter) return reply.code(404).send({ message: 'Membership letter not found' });
  return reply.send(letter);
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as CreateMembershipLetterRequest;
  const letter = await service.createMembershipLetter(req.session.userId!, body);
  logAudit(req.session.userId!, 'create', 'membership_letter', letter.id, { ipAddress: req.ip });
  return reply.code(201).send(letter);
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as UpdateMembershipLetterRequest;
  const letter = await service.updateMembershipLetter(req.session.userId!, id, body);
  if (!letter) return reply.code(404).send({ message: 'Membership letter not found' });
  logAudit(req.session.userId!, 'update', 'membership_letter', id, { ipAddress: req.ip });
  return reply.send(letter);
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const result = await service.deleteMembershipLetter(req.session.userId!, id);
  if (result === null) return reply.code(404).send({ message: 'Membership letter not found' });
  logAudit(req.session.userId!, 'delete', 'membership_letter', id, { ipAddress: req.ip });
  return reply.code(204).send();
}

export async function render(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const html = await service.renderMembershipLetter(req.session.userId!, id);
  return reply.type('text/html; charset=utf-8').send(html);
}
