import { FastifyRequest, FastifyReply } from 'fastify';
import type { IdParam } from '../../../lib/validation.js';
import type { z } from 'zod';
import {
  PaginatedMonthQueryRequestSchema,
  MonthQueryRequestSchema,
  OptionalMonthQueryRequestSchema
} from './schema.js';
import * as service from './service.js';

type PaginatedMonthQuery = z.infer<typeof PaginatedMonthQueryRequestSchema>;
type MonthQuery = z.infer<typeof MonthQueryRequestSchema>;
type OptionalMonthQuery = z.infer<typeof OptionalMonthQueryRequestSchema>;

export async function incomeReport(req: FastifyRequest, reply: FastifyReply) {
  const { month, page, limit, status } = req.query as PaginatedMonthQuery;
  return reply.send(await service.getIncomeReport(req.session.userId!, month, page, limit, status));
}

export async function expenseReport(req: FastifyRequest, reply: FastifyReply) {
  const { month, page, limit, status } = req.query as PaginatedMonthQuery;
  return reply.send(
    await service.getExpenseReport(req.session.userId!, month, page, limit, status)
  );
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

export async function attendersReport(req: FastifyRequest, reply: FastifyReply) {
  const { month } = req.query as MonthQuery;
  return reply.send(await service.getAttendersReport(req.session.userId!, month));
}

export async function campaignList(req: FastifyRequest, reply: FastifyReply) {
  const { month } = req.query as OptionalMonthQuery;
  return reply.send(await service.getCampaignList(req.session.userId!, month));
}

export async function campaignDetail(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const { month } = req.query as OptionalMonthQuery;
  return reply.send(await service.getCampaignDetail(req.session.userId!, id, month));
}

export async function eventList(req: FastifyRequest, reply: FastifyReply) {
  const { month } = req.query as OptionalMonthQuery;
  return reply.send(await service.getEventList(req.session.userId!, month));
}

export async function eventDetail(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const { month } = req.query as OptionalMonthQuery;
  return reply.send(await service.getEventDetail(req.session.userId!, id, month));
}
