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

export async function uploadLogo(req: FastifyRequest, reply: FastifyReply) {
  const file = await req.file();
  if (!file) return reply.code(400).send({ message: 'No file uploaded' });

  const buffer = await file.toBuffer();
  const settings = await service.uploadChurchLogo(req.session.userId!, buffer, file.mimetype);
  logAudit(req.session.userId!, 'update', 'church_settings', 1, { ipAddress: req.ip });
  return reply.send(settings);
}

export async function deleteLogo(req: FastifyRequest, reply: FastifyReply) {
  const result = await service.deleteChurchLogo(req.session.userId!);
  if (result === 'no_logo') return reply.code(404).send({ message: 'No logo to remove' });
  logAudit(req.session.userId!, 'update', 'church_settings', 1, { ipAddress: req.ip });
  return reply.code(204).send();
}

export async function getLogo(req: FastifyRequest, reply: FastifyReply) {
  const file = await service.getChurchLogoFile();
  if (!file) return reply.code(404).send({ message: 'Logo not found' });
  reply.header('Content-Type', file.contentType);
  reply.header('Content-Disposition', 'inline; filename="logo"');
  if (file.contentLength !== null) reply.header('Content-Length', file.contentLength);
  return reply.send(file.body);
}
