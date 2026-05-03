import { FastifyRequest, FastifyReply } from 'fastify';
import type { CreateMemberRequest, UpdateMemberRequest } from './schema';
import type { IdParam } from '../../lib/validation';
import type { PaginationQuery } from '../../lib/pagination';
import * as service from './service';

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const { page, limit } = req.query as PaginationQuery;
  return reply.send(await service.listMembers(req.session.userId!, page, limit));
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const member = await service.getMemberById(id);
  if (!member) return reply.code(404).send({ message: 'Member not found' });
  return reply.send(member);
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as CreateMemberRequest;
  const member = await service.createMember(req.session.userId!, body);
  return reply.code(201).send(member);
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as UpdateMemberRequest;
  const member = await service.updateMember(req.session.userId!, id, body);
  if (!member) return reply.code(404).send({ message: 'Member not found' });
  return reply.send(member);
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const result = await service.deactivateMember(req.session.userId!, id);
  if (result === null) return reply.code(404).send({ message: 'Member not found' });
  return reply.code(204).send();
}
