import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../../hooks/requireAuth.js';
import { checkPermission } from '../../../hooks/checkPermission.js';
import { Module, Action } from '../../../lib/constants.js';
import { IdParamSchema } from '../../../lib/validation.js';
import { ErrorResponseSchema } from '../../../lib/http-schemas.js';
import {
  PaginatedMonthQuerySchema,
  MonthQuerySchema,
  OptionalMonthQuerySchema,
  IncomeReportResponseSchema,
  ExpenseReportResponseSchema,
  FinancialStatementResponseSchema,
  DetailedFinancialStatementResponseSchema,
  MembersReportResponseSchema,
  FundListResponseSchema,
  FundDetailResponseSchema
} from './schema.js';
import * as controller from './controller.js';

const PdfResponseSchema = {
  type: 'string',
  format: 'binary',
  description: 'PDF document'
} as const;

export async function reportsRoutes(app: FastifyInstance) {
  app.get(
    '/reports/income',
    {
      schema: {
        tags: ['Reports'],
        querystring: PaginatedMonthQuerySchema,
        response: {
          200: IncomeReportResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Reports, Action.Report)]
    },
    controller.incomeReport
  );

  app.get(
    '/reports/expenses',
    {
      schema: {
        tags: ['Reports'],
        querystring: PaginatedMonthQuerySchema,
        response: {
          200: ExpenseReportResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Reports, Action.Report)]
    },
    controller.expenseReport
  );

  app.get(
    '/reports/financial-statement',
    {
      schema: {
        tags: ['Reports'],
        querystring: MonthQuerySchema,
        response: {
          200: FinancialStatementResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Reports, Action.Report)]
    },
    controller.financialStatement
  );

  app.get(
    '/reports/financial-statement/pdf',
    {
      schema: {
        tags: ['Reports'],
        querystring: MonthQuerySchema,
        response: {
          200: PdfResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Reports, Action.Report)]
    },
    controller.financialStatementPdf
  );

  app.get(
    '/reports/financial-statement/detailed',
    {
      schema: {
        tags: ['Reports'],
        querystring: MonthQuerySchema,
        response: {
          200: DetailedFinancialStatementResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Reports, Action.Report)]
    },
    controller.detailedFinancialStatement
  );

  app.get(
    '/reports/financial-statement/detailed/pdf',
    {
      schema: {
        tags: ['Reports'],
        querystring: MonthQuerySchema,
        response: {
          200: PdfResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Reports, Action.Report)]
    },
    controller.detailedFinancialStatementPdf
  );

  app.get(
    '/reports/members',
    {
      schema: {
        tags: ['Reports'],
        querystring: MonthQuerySchema,
        response: {
          200: MembersReportResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Reports, Action.Report)]
    },
    controller.membersReport
  );

  app.get(
    '/reports/funds',
    {
      schema: {
        tags: ['Reports'],
        querystring: OptionalMonthQuerySchema,
        response: {
          200: FundListResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Reports, Action.Report)]
    },
    controller.fundList
  );

  app.get(
    '/reports/funds/:id',
    {
      schema: {
        tags: ['Reports'],
        params: IdParamSchema,
        querystring: OptionalMonthQuerySchema,
        response: {
          200: FundDetailResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Reports, Action.Report)]
    },
    controller.fundDetail
  );
}
