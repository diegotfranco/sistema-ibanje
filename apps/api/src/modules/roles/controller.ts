import { FastifyRequest, FastifyReply } from 'fastify';
import {
  ListRolesRequestSchema,
  CreateRoleRequestSchema,
  UpdateRoleRequestSchema,
  SetRolePermissionsRequestSchema
} from './schema';
import * as service from './service';
import { IdParamSchema } from '../../lib/validation';

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const query = ListRolesRequestSchema.parse(req.query);
  return reply.send(await service.listRoles(req.session.userId!, query.page, query.limit));
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const role = await service.getRoleById(id);
  if (!role) return reply.code(404).send({ message: 'Role not found' });
  return reply.send(role);
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const body = CreateRoleRequestSchema.parse(req.body);
  const role = await service.createRole(req.session.userId!, body);
  return reply.code(201).send(role);
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const body = UpdateRoleRequestSchema.parse(req.body);
  const role = await service.updateRole(req.session.userId!, id, body);
  if (!role) return reply.code(404).send({ message: 'Role not found' });
  return reply.send(role);
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const result = await service.deactivateRole(req.session.userId!, id);
  if (result === null) return reply.code(404).send({ message: 'Role not found' });
  return reply.code(204).send();
}

export async function getPermissions(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const perms = await service.getRolePermissions(id);
  if (perms === null) return reply.code(404).send({ message: 'Role not found' });
  return reply.send(perms);
}

export async function setPermissions(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const body = SetRolePermissionsRequestSchema.parse(req.body);
  const result = await service.setRolePermissions(req.session.userId!, id, body);
  if (result === null) return reply.code(404).send({ message: 'Role not found' });
  return reply.code(204).send();
}

export async function getModules(_req: FastifyRequest, reply: FastifyReply) {
  return reply.send(await service.listModules());
}

export async function getPermissionTypes(_req: FastifyRequest, reply: FastifyReply) {
  return reply.send(await service.listPermissionTypes());
}
