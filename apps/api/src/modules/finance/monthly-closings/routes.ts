import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../../hooks/requireAuth.js';
import { checkPermission } from '../../../hooks/checkPermission.js';
import { Module, Action } from '../../../lib/constants.js';
import { IdParamSchema } from '../../../lib/validation.js';
import { ErrorResponseSchema } from '../../../lib/http-schemas.js';
import {
  ListMonthlyClosingsRequestSchema,
  CreateMonthlyClosingRequestSchema,
  SubmitMonthlyClosingRequestSchema,
  ApproveMonthlyClosingRequestSchema,
  RejectMonthlyClosingRequestSchema,
  ResubmitMonthlyClosingRequestSchema,
  ReproveClosingRequestSchema,
  MonthlyClosingResponseSchema,
  MonthlyClosingListResponseSchema,
  MonthlyClosingYearsResponseSchema
} from './schema.js';
import * as controller from './controller.js';

export async function monthlyClosingsRoutes(app: FastifyInstance) {
  app.get(
    '/monthly-closings',
    {
      schema: {
        tags: ['Monthly Closings'],
        querystring: ListMonthlyClosingsRequestSchema,
        response: {
          200: MonthlyClosingListResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.MonthlyClosings, Action.View)]
    },
    controller.list
  );

  app.get(
    '/monthly-closings/years',
    {
      schema: {
        tags: ['Monthly Closings'],
        response: {
          200: MonthlyClosingYearsResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.MonthlyClosings, Action.View)]
    },
    controller.listYears
  );

  app.get(
    '/monthly-closings/:id',
    {
      schema: {
        tags: ['Monthly Closings'],
        params: IdParamSchema,
        response: {
          200: MonthlyClosingResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.getById
  );

  app.post(
    '/monthly-closings',
    {
      schema: {
        tags: ['Monthly Closings'],
        body: CreateMonthlyClosingRequestSchema,
        response: {
          201: MonthlyClosingResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.MonthlyClosings, Action.Create)]
    },
    controller.create
  );

  app.post(
    '/monthly-closings/:id/submit',
    {
      schema: {
        tags: ['Monthly Closings'],
        params: IdParamSchema,
        body: SubmitMonthlyClosingRequestSchema,
        response: {
          200: MonthlyClosingResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.MonthlyClosings, Action.Create)]
    },
    controller.submit
  );

  app.post(
    '/monthly-closings/:id/approve',
    {
      schema: {
        tags: ['Monthly Closings'],
        params: IdParamSchema,
        body: ApproveMonthlyClosingRequestSchema,
        response: {
          200: MonthlyClosingResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.MonthlyClosings, Action.Review)]
    },
    controller.approve
  );

  app.post(
    '/monthly-closings/:id/reject',
    {
      schema: {
        tags: ['Monthly Closings'],
        params: IdParamSchema,
        body: RejectMonthlyClosingRequestSchema,
        response: {
          200: MonthlyClosingResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.MonthlyClosings, Action.Review)]
    },
    controller.reject
  );

  app.post(
    '/monthly-closings/:id/reopen',
    {
      schema: {
        tags: ['Monthly Closings'],
        params: IdParamSchema,
        response: {
          200: MonthlyClosingResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.MonthlyClosings, Action.Create)]
    },
    controller.reopen
  );

  app.post(
    '/monthly-closings/:id/resubmit',
    {
      schema: {
        tags: ['Monthly Closings'],
        params: IdParamSchema,
        body: ResubmitMonthlyClosingRequestSchema,
        response: {
          200: MonthlyClosingResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.MonthlyClosings, Action.Create)]
    },
    controller.resubmit
  );

  app.post(
    '/monthly-closings/:id/reprove',
    {
      schema: {
        tags: ['Monthly Closings'],
        params: IdParamSchema,
        body: ReproveClosingRequestSchema,
        response: {
          200: MonthlyClosingResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.MonthlyClosings, Action.Review)]
    },
    controller.reprove
  );

  app.post(
    '/monthly-closings/:id/close',
    {
      schema: {
        tags: ['Monthly Closings'],
        params: IdParamSchema,
        response: {
          200: MonthlyClosingResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.MonthlyClosings, Action.Update)]
    },
    controller.close
  );

  app.delete(
    '/monthly-closings/:id',
    {
      schema: {
        tags: ['Monthly Closings'],
        params: IdParamSchema,
        response: {
          204: { type: 'null', description: 'Deleted' },
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.MonthlyClosings, Action.Delete)]
    },
    controller.remove
  );
}
