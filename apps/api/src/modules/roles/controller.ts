import { FastifyRequest, FastifyReply } from 'fastify';
import type { CreateRoleRequest, UpdateRoleRequest, SetRolePermissionsRequest } from './schema.js';
import type { IdParam } from '../../lib/validation.js';
import type { PaginationQuery } from '../../lib/pagination.js';
import * as service from './service.js';

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const { page, limit } = req.query as PaginationQuery;
  return reply.send(await service.listRoles(req.session.userId!, page, limit));
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const role = await service.getRoleById(id);
  if (!role) return reply.code(404).send({ message: 'Role not found' });
  return reply.send(role);
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as CreateRoleRequest;
  const role = await service.createRole(req.session.userId!, body);
  return reply.code(201).send(role);
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as UpdateRoleRequest;
  const role = await service.updateRole(req.session.userId!, id, body);
  if (!role) return reply.code(404).send({ message: 'Role not found' });
  return reply.send(role);
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const result = await service.deactivateRole(req.session.userId!, id);
  if (result === null) return reply.code(404).send({ message: 'Role not found' });
  return reply.code(204).send();
}

export async function getPermissions(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const perms = await service.getRolePermissions(id);
  if (perms === null) return reply.code(404).send({ message: 'Role not found' });
  return reply.send(perms);
}

export async function setPermissions(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as SetRolePermissionsRequest;
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
