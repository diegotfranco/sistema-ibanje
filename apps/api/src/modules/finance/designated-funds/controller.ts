import { FastifyRequest, FastifyReply } from 'fastify';
import {
  ListDesignatedFundsRequestSchema,
  CreateDesignatedFundRequestSchema,
  UpdateDesignatedFundRequestSchema
} from './schema';
import * as service from './service';
import { IdParamSchema } from '../../../lib/validation';

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const query = ListDesignatedFundsRequestSchema.parse(req.query);
  return reply.send(await service.listDesignatedFunds(req.session.userId!, query.page, query.limit));
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const fund = await service.getDesignatedFundById(id);
  if (!fund) return reply.code(404).send({ message: 'Designated fund not found' });
  return reply.send(fund);
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const body = CreateDesignatedFundRequestSchema.parse(req.body);
  return reply.code(201).send(await service.createDesignatedFund(req.session.userId!, body));
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const body = UpdateDesignatedFundRequestSchema.parse(req.body);
  const fund = await service.updateDesignatedFund(req.session.userId!, id, body);
  if (!fund) return reply.code(404).send({ message: 'Designated fund not found' });
  return reply.send(fund);
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const result = await service.deactivateDesignatedFund(req.session.userId!, id);
  if (result === null) return reply.code(404).send({ message: 'Designated fund not found' });
  return reply.code(204).send();
}
