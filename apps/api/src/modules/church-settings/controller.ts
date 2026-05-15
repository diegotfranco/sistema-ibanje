import { FastifyRequest, FastifyReply } from 'fastify';
import type { UpdateChurchSettingsRequest } from './schema.js';
import { logAudit } from '../../lib/audit.js';
import * as service from './service.js';

export async function getSettings(req: FastifyRequest, reply: FastifyReply) {
  const settings = await service.getChurchSettings();
  if (!settings) return reply.code(404).send({ message: 'Church settings not found' });
  return reply.send(settings);
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as UpdateChurchSettingsRequest;
  const settings = await service.updateChurchSettings(req.session.userId!, body);
  if (!settings) return reply.code(404).send({ message: 'Church settings not found' });
  logAudit(req.session.userId!, 'update', 'church_settings', 1, { ipAddress: req.ip });
  return reply.send(settings);
}
