import { FastifyRequest, FastifyReply } from 'fastify';
import type { IdParam } from '../../../lib/validation.js';
import type { PaginatedDateRangeQuery, DateRangeQuery } from './schema.js';
import * as service from './service.js';

export async function incomeReport(req: FastifyRequest, reply: FastifyReply) {
  const { from, to, page, limit } = req.query as PaginatedDateRangeQuery;
  return reply.send(await service.getIncomeReport(req.session.userId!, from, to, page, limit));
}

export async function expenseReport(req: FastifyRequest, reply: FastifyReply) {
  const { from, to, page, limit } = req.query as PaginatedDateRangeQuery;
  return reply.send(await service.getExpenseReport(req.session.userId!, from, to, page, limit));
}

export async function financialStatement(req: FastifyRequest, reply: FastifyReply) {
  const { from, to } = req.query as DateRangeQuery;
  return reply.send(await service.getFinancialStatement(req.session.userId!, from, to));
}

export async function financialStatementPdf(req: FastifyRequest, reply: FastifyReply) {
  const { from, to } = req.query as DateRangeQuery;
  const pdf = await service.renderFinancialStatementPdf(req.session.userId!, from, to);
  return reply
    .header('Content-Type', 'application/pdf')
    .header(
      'Content-Disposition',
      `attachment; filename="relatorio_fechamento_simples-${from}-${to}.pdf"`
    )
    .send(pdf);
}

export async function detailedFinancialStatement(req: FastifyRequest, reply: FastifyReply) {
  const { from, to } = req.query as DateRangeQuery;
  return reply.send(await service.getDetailedFinancialStatement(req.session.userId!, from, to));
}

export async function detailedFinancialStatementPdf(req: FastifyRequest, reply: FastifyReply) {
  const { from, to } = req.query as DateRangeQuery;
  const pdf = await service.renderDetailedFinancialStatementPdf(req.session.userId!, from, to);
  return reply
    .header('Content-Type', 'application/pdf')
    .header(
      'Content-Disposition',
      `attachment; filename="relatorio_fechamento_detalhado-${from}-${to}.pdf"`
    )
    .send(pdf);
}

export async function membersReport(req: FastifyRequest, reply: FastifyReply) {
  return reply.send(await service.getMembersReport(req.session.userId!));
}

export async function fundList(req: FastifyRequest, reply: FastifyReply) {
  return reply.send(await service.getFundList(req.session.userId!));
}

export async function fundDetail(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  return reply.send(await service.getFundDetail(req.session.userId!, id));
}
