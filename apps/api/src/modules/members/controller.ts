import { FastifyRequest, FastifyReply } from 'fastify';
import { ListMembersRequestSchema, CreateMemberRequestSchema, UpdateMemberRequestSchema } from './schema.js';
import * as service from './service.js';
import { z } from 'zod';

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const query = ListMembersRequestSchema.parse(req.query);

  const result = await service.listMembers(req.session.userId!, query.page, query.limit);

  return reply.send(result);
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = z.object({ id: z.coerce.number().int().positive() }).parse(req.params);

  const member = await service.getMemberById(id);

  if (!member) {
    return reply.code(404).send({ message: 'Member not found' });
  }

  return reply.send(member);
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const body = CreateMemberRequestSchema.parse(req.body);

  const member = await service.createMember(req.session.userId!, body);

  return reply.code(201).send(member);
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = z.object({ id: z.coerce.number().int().positive() }).parse(req.params);
  const body = UpdateMemberRequestSchema.parse(req.body);

  const member = await service.updateMember(req.session.userId!, id, body);

  if (!member) {
    return reply.code(404).send({ message: 'Member not found' });
  }

  return reply.send(member);
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = z.object({ id: z.coerce.number().int().positive() }).parse(req.params);

  const result = await service.deactivateMember(req.session.userId!, id);

  if (result === null) {
    return reply.code(404).send({ message: 'Member not found' });
  }

  return reply.code(204).send();
}
