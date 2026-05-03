import { FastifyRequest, FastifyReply } from 'fastify';
import type {
  CreateMonthlyClosingRequest,
  SubmitMonthlyClosingRequest,
  ApproveMonthlyClosingRequest,
  RejectMonthlyClosingRequest
} from './schema';
import type { IdParam } from '../../../lib/validation';
import type { PaginationQuery } from '../../../lib/pagination';
import * as service from './service';

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const { page, limit } = req.query as PaginationQuery;
  return reply.send(await service.listMonthlyClosings(req.session.userId!, page, limit));
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const closing = await service.getMonthlyClosingById(id);
  if (!closing) return reply.code(404).send({ message: 'Monthly closing not found' });
  return reply.send(closing);
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as CreateMonthlyClosingRequest;
  return reply.code(201).send(await service.createMonthlyClosing(req.session.userId!, body));
}

export async function submit(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as SubmitMonthlyClosingRequest;
  return reply.send(await service.submitMonthlyClosing(req.session.userId!, id, body));
}

export async function approve(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as ApproveMonthlyClosingRequest;
  return reply.send(await service.approveMonthlyClosing(req.session.userId!, id, body));
}

export async function reject(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as RejectMonthlyClosingRequest;
  return reply.send(await service.rejectMonthlyClosing(req.session.userId!, id, body));
}

export async function close(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  return reply.send(await service.closeMonthlyClosing(req.session.userId!, id));
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const result = await service.deleteMonthlyClosing(req.session.userId!, id);
  if (result === null) return reply.code(404).send({ message: 'Monthly closing not found' });
  return reply.code(204).send();
}
