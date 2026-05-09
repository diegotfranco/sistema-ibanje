import { FastifyRequest, FastifyReply } from 'fastify';
import type {
  ListUsersRequest,
  UpdateUserRequest,
  UpdatePasswordRequest,
  UpdatePermissionsRequest,
  CreateUserRequest
} from './schema.js';
import type { IdParam } from '../../lib/validation.js';
import { logAudit } from '../../lib/audit.js';
import { sendInviteEmail } from '../../lib/email.js';
import * as service from './service.js';

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const { page, limit } = req.query as ListUsersRequest;
  return reply.send(await service.listUsers(page, limit));
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const user = await service.getUserById(id);
  if (!user) return reply.code(404).send({ message: 'User not found' });
  return reply.send(user);
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as UpdateUserRequest;
  const user = await service.updateUser(req.session.userId!, id, body);
  if (!user) return reply.code(404).send({ message: 'User not found' });
  logAudit(req.session.userId!, 'update', 'user', id, { ipAddress: req.ip });
  return reply.send(user);
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const result = await service.deactivateUser(req.session.userId!, id);
  if (result === null) return reply.code(404).send({ message: 'User not found' });
  logAudit(req.session.userId!, 'delete', 'user', id, { ipAddress: req.ip });
  return reply.code(204).send();
}

export async function changePassword(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as UpdatePasswordRequest;
  await service.changePassword(req.session.userId!, id, body);
  return reply.code(204).send();
}

export async function getPermissions(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  return reply.send(await service.getUserPermissions(id));
}

export async function setPermissions(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const { permissions } = req.body as UpdatePermissionsRequest;
  await service.setUserPermissions(req.session.userId!, id, permissions);
  logAudit(req.session.userId!, 'update', 'user', id, { notes: 'permissions', ipAddress: req.ip });
  return reply.code(204).send();
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as CreateUserRequest;
  let inviteToken = '';
  const user = await service.createUser(body, (token) => {
    inviteToken = token;
  });
  await sendInviteEmail(body.email, inviteToken);
  logAudit(req.session.userId!, 'create', 'user', user.id, { ipAddress: req.ip });
  return reply.code(201).send(user);
}

export async function approve(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  let inviteToken = '';
  let inviteEmail = '';
  const user = await service.approveUser(id, (token, email) => {
    inviteToken = token;
    inviteEmail = email;
  });
  if (!user) return reply.code(404).send({ message: 'User not found' });
  await sendInviteEmail(inviteEmail, inviteToken);
  logAudit(req.session.userId!, 'state_change', 'user', id, {
    notes: 'approved',
    ipAddress: req.ip
  });
  return reply.send(user);
}
