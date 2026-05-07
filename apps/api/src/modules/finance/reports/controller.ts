import { FastifyRequest, FastifyReply } from 'fastify';
import type { IdParam } from '../../../lib/validation.js';
import type { z } from 'zod';
import { PaginatedMonthQuerySchema, MonthQuerySchema, OptionalMonthQuerySchema } from './schema.js';
import * as service from './service.js';

type PaginatedMonthQuery = z.infer<typeof PaginatedMonthQuerySchema>;
type MonthQuery = z.infer<typeof MonthQuerySchema>;
type OptionalMonthQuery = z.infer<typeof OptionalMonthQuerySchema>;

export async function incomeReport(req: FastifyRequest, reply: FastifyReply) {
  const { month, page, limit } = req.query as PaginatedMonthQuery;
  return reply.send(await service.getIncomeReport(req.session.userId!, month, page, limit));
}

export async function expenseReport(req: FastifyRequest, reply: FastifyReply) {
  const { month, page, limit } = req.query as PaginatedMonthQuery;
  return reply.send(await service.getExpenseReport(req.session.userId!, month, page, limit));
}

export async function financialStatement(req: FastifyRequest, reply: FastifyReply) {
  const { month } = req.query as MonthQuery;
  return reply.send(await service.getFinancialStatement(req.session.userId!, month));
}

export async function financialStatementPdf(req: FastifyRequest, reply: FastifyReply) {
  const { month } = req.query as MonthQuery;
  const pdf = await service.renderFinancialStatementPdf(req.session.userId!, month);
  return reply
    .header('Content-Type', 'application/pdf')
    .header(
      'Content-Disposition',
      `attachment; filename="relatorio_fechamento_simples-${month}.pdf"`
    )
    .send(pdf);
}

export async function detailedFinancialStatement(req: FastifyRequest, reply: FastifyReply) {
  const { month } = req.query as MonthQuery;
  return reply.send(await service.getDetailedFinancialStatement(req.session.userId!, month));
}

export async function detailedFinancialStatementPdf(req: FastifyRequest, reply: FastifyReply) {
  const { month } = req.query as MonthQuery;
  const pdf = await service.renderDetailedFinancialStatementPdf(req.session.userId!, month);
  return reply
    .header('Content-Type', 'application/pdf')
    .header(
      'Content-Disposition',
      `attachment; filename="relatorio_fechamento_detalhado-${month}.pdf"`
    )
    .send(pdf);
}

export async function membersReport(req: FastifyRequest, reply: FastifyReply) {
  const { month } = req.query as MonthQuery;
  return reply.send(await service.getMembersReport(req.session.userId!, month));
}

export async function fundList(req: FastifyRequest, reply: FastifyReply) {
  const { month } = req.query as OptionalMonthQuery;
  return reply.send(await service.getFundList(req.session.userId!, month));
}

export async function fundDetail(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const { month } = req.query as OptionalMonthQuery;
  return reply.send(await service.getFundDetail(req.session.userId!, id, month));
}
