import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../../hooks/requireAuth.js';
import { checkPermission } from '../../../hooks/checkPermission.js';
import { Module, Action } from '../../../lib/constants.js';
import { IdParamSchema } from '../../../lib/validation.js';
import { ErrorResponseSchema } from '../../../lib/http-schemas.js';
import {
  PaginatedMonthQueryRequestSchema,
  MonthQueryRequestSchema,
  OptionalMonthQueryRequestSchema,
  IncomeReportResponseSchema,
  ExpenseReportResponseSchema,
  FinancialStatementResponseSchema,
  DetailedFinancialStatementResponseSchema,
  AttendersReportResponseSchema,
  CampaignListResponseSchema,
  CampaignDetailResponseSchema,
  EventListResponseSchema,
  EventDetailResponseSchema
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
        querystring: PaginatedMonthQueryRequestSchema,
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
        querystring: PaginatedMonthQueryRequestSchema,
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
        querystring: MonthQueryRequestSchema,
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
        querystring: MonthQueryRequestSchema,
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
        querystring: MonthQueryRequestSchema,
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
        querystring: MonthQueryRequestSchema,
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
    '/reports/attenders',
    {
      schema: {
        tags: ['Reports'],
        querystring: MonthQueryRequestSchema,
        response: {
          200: AttendersReportResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Reports, Action.Report)]
    },
    controller.attendersReport
  );

  app.get(
    '/reports/campaigns',
    {
      schema: {
        tags: ['Reports'],
        querystring: OptionalMonthQueryRequestSchema,
        response: {
          200: CampaignListResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Reports, Action.Report)]
    },
    controller.campaignList
  );

  app.get(
    '/reports/campaigns/:id',
    {
      schema: {
        tags: ['Reports'],
        params: IdParamSchema,
        querystring: OptionalMonthQueryRequestSchema,
        response: {
          200: CampaignDetailResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Reports, Action.Report)]
    },
    controller.campaignDetail
  );

  app.get(
    '/reports/events',
    {
      schema: {
        tags: ['Reports'],
        querystring: OptionalMonthQueryRequestSchema,
        response: {
          200: EventListResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Reports, Action.Report)]
    },
    controller.eventList
  );

  app.get(
    '/reports/events/:id',
    {
      schema: {
        tags: ['Reports'],
        params: IdParamSchema,
        querystring: OptionalMonthQueryRequestSchema,
        response: {
          200: EventDetailResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Reports, Action.Report)]
    },
    controller.eventDetail
  );
}
