import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../../hooks/requireAuth.js';
import { checkPermission } from '../../../hooks/checkPermission.js';
import { Module, Action } from '../../../lib/constants.js';
import { IdParamSchema } from '../../../lib/validation.js';
import { PaginatedMonthQuerySchema, MonthQuerySchema, OptionalMonthQuerySchema } from './schema.js';
import * as controller from './controller.js';

export async function reportsRoutes(app: FastifyInstance) {
  app.get(
    '/reports/income',
    {
      schema: { tags: ['Reports'], querystring: PaginatedMonthQuerySchema },
      preHandler: [requireAuth, checkPermission(Module.Reports, Action.Report)]
    },
    controller.incomeReport
  );

  app.get(
    '/reports/expenses',
    {
      schema: { tags: ['Reports'], querystring: PaginatedMonthQuerySchema },
      preHandler: [requireAuth, checkPermission(Module.Reports, Action.Report)]
    },
    controller.expenseReport
  );

  app.get(
    '/reports/financial-statement',
    {
      schema: { tags: ['Reports'], querystring: MonthQuerySchema },
      preHandler: [requireAuth, checkPermission(Module.Reports, Action.Report)]
    },
    controller.financialStatement
  );

  app.get(
    '/reports/financial-statement/pdf',
    {
      schema: { tags: ['Reports'], querystring: MonthQuerySchema },
      preHandler: [requireAuth, checkPermission(Module.Reports, Action.Report)]
    },
    controller.financialStatementPdf
  );

  app.get(
    '/reports/financial-statement/detailed',
    {
      schema: { tags: ['Reports'], querystring: MonthQuerySchema },
      preHandler: [requireAuth, checkPermission(Module.Reports, Action.Report)]
    },
    controller.detailedFinancialStatement
  );

  app.get(
    '/reports/financial-statement/detailed/pdf',
    {
      schema: { tags: ['Reports'], querystring: MonthQuerySchema },
      preHandler: [requireAuth, checkPermission(Module.Reports, Action.Report)]
    },
    controller.detailedFinancialStatementPdf
  );

  app.get(
    '/reports/members',
    {
      schema: { tags: ['Reports'], querystring: MonthQuerySchema },
      preHandler: [requireAuth, checkPermission(Module.Reports, Action.Report)]
    },
    controller.membersReport
  );

  app.get(
    '/reports/funds',
    {
      schema: { tags: ['Reports'], querystring: OptionalMonthQuerySchema },
      preHandler: [requireAuth, checkPermission(Module.Reports, Action.Report)]
    },
    controller.fundList
  );

  app.get(
    '/reports/funds/:id',
    {
      schema: { tags: ['Reports'], params: IdParamSchema, querystring: OptionalMonthQuerySchema },
      preHandler: [requireAuth, checkPermission(Module.Reports, Action.Report)]
    },
    controller.fundDetail
  );
}
