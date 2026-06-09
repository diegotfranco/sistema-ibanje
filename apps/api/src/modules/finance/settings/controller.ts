import { FastifyRequest, FastifyReply } from 'fastify';
import type { UpdateFinanceSettingsRequest } from './schema.js';
import { logAudit } from '../../../lib/audit.js';
import * as service from './service.js';

export async function getSettings(_req: FastifyRequest, reply: FastifyReply) {
  return reply.send(await service.getFinanceSettings());
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as UpdateFinanceSettingsRequest;
  const settings = await service.updateOpeningBalance(req.session.userId!, body);
  logAudit(req.session.userId!, 'update', 'finance_settings', 1, { ipAddress: req.ip });
  return reply.send(settings);
}
