import { FastifyRequest, FastifyReply } from 'fastify';
import {
  ListUsersRequestSchema,
  UpdateUserRequestSchema,
  UpdatePasswordRequestSchema,
  UpdatePermissionsRequestSchema,
  CreateUserRequestSchema
} from './schema';
import * as service from './service';
import { IdParamSchema } from '../../lib/validation';

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const query = ListUsersRequestSchema.parse(req.query);

  const result = await service.listUsers(query.page, query.limit);

  return reply.send(result);
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);

  const user = await service.getUserById(id);

  if (!user) {
    return reply.code(404).send({ message: 'User not found' });
  }

  return reply.send(user);
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const body = UpdateUserRequestSchema.parse(req.body);

  const user = await service.updateUser(req.session.userId!, id, body);

  if (!user) {
    return reply.code(404).send({ message: 'User not found' });
  }

  return reply.send(user);
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);

  const result = await service.deactivateUser(req.session.userId!, id);
  if (result === null) return reply.code(404).send({ message: 'User not found' });

  return reply.code(204).send();
}

export async function changePassword(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const body = UpdatePasswordRequestSchema.parse(req.body);

  await service.changePassword(req.session.userId!, id, body);

  return reply.code(204).send();
}

export async function getPermissions(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);

  const result = await service.getUserPermissions(id);

  return reply.send(result);
}

export async function setPermissions(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const body = UpdatePermissionsRequestSchema.parse(req.body);

  await service.setUserPermissions(req.session.userId!, id, body.permissions);

  return reply.code(204).send();
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const body = CreateUserRequestSchema.parse(req.body);
  const user = await service.createUser(body, (token) => {
    req.log.info({ inviteToken: token, email: body.email }, 'TODO: send invite email');
  });
  return reply.code(201).send(user);
}

export async function approve(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const user = await service.approveUser(id, (token, email) => {
    req.log.info({ inviteToken: token, email }, 'TODO: send invite email');
  });
  if (!user) return reply.code(404).send({ message: 'User not found' });
  return reply.send(user);
}
