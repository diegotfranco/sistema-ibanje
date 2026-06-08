import { FastifyRequest, FastifyReply } from 'fastify';
import type { CampaignStatusValue } from '@sistema-ibanje/shared';
import type { CreateCampaignRequest, UpdateCampaignRequest } from './schema.js';
import type { IdParam } from '../../../lib/validation.js';
import type { PaginationQuery } from '../../../lib/pagination.js';
import * as service from './service.js';

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const { page, limit, status } = req.query as PaginationQuery & { status?: CampaignStatusValue };
  return reply.send(await service.listCampaigns(req.session.userId!, page, limit, status));
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const campaign = await service.getCampaignById(id);
  if (!campaign) return reply.code(404).send({ message: 'Campaign not found' });
  return reply.send(campaign);
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as CreateCampaignRequest;
  return reply.code(201).send(await service.createCampaign(req.session.userId!, body));
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as UpdateCampaignRequest;
  const campaign = await service.updateCampaign(req.session.userId!, id, body);
  if (!campaign) return reply.code(404).send({ message: 'Campaign not found' });
  return reply.send(campaign);
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const result = await service.softDeleteCampaign(req.session.userId!, id);
  if (result === null) return reply.code(404).send({ message: 'Campaign not found' });
  return reply.code(204).send();
}

export async function restore(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const campaign = await service.restoreCampaign(req.session.userId!, id);
  if (!campaign) return reply.code(404).send({ message: 'Campaign not found' });
  return reply.send(campaign);
}

export async function encerrar(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const campaign = await service.encerrarCampaign(req.session.userId!, id);
  if (!campaign) return reply.code(404).send({ message: 'Campaign not found' });
  return reply.send(campaign);
}

export async function reabrir(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const campaign = await service.reabrirCampaign(req.session.userId!, id);
  if (!campaign) return reply.code(404).send({ message: 'Campaign not found' });
  return reply.send(campaign);
}
