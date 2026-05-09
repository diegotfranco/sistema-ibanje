import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../../../hooks/requireAuth.js';
import { checkPermission } from '../../../../hooks/checkPermission.js';
import { Module, Action } from '../../../../lib/constants.js';
import { IdParamSchema } from '../../../../lib/validation.js';
import { ErrorResponseSchema } from '../../../../lib/http-schemas.js';
import {
  ListIncomeEntriesRequestSchema,
  CreateIncomeEntryRequestSchema,
  UpdateIncomeEntryRequestSchema,
  IncomeEntryResponseSchema,
  IncomeEntryListResponseSchema
} from './schema.js';
import * as controller from './controller.js';

export async function incomeEntriesRoutes(app: FastifyInstance) {
  app.get(
    '/income-entries',
    {
      schema: {
        tags: ['Income Entries'],
        querystring: ListIncomeEntriesRequestSchema,
        response: {
          200: IncomeEntryListResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.IncomeEntries, Action.View)]
    },
    controller.list
  );

  app.get(
    '/income-entries/:id',
    {
      schema: {
        tags: ['Income Entries'],
        params: IdParamSchema,
        response: {
          200: IncomeEntryResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.getById
  );

  app.post(
    '/income-entries',
    {
      schema: {
        tags: ['Income Entries'],
        body: CreateIncomeEntryRequestSchema,
        response: {
          201: IncomeEntryResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.IncomeEntries, Action.Create)]
    },
    controller.create
  );

  app.patch(
    '/income-entries/:id',
    {
      schema: {
        tags: ['Income Entries'],
        params: IdParamSchema,
        body: UpdateIncomeEntryRequestSchema,
        response: {
          200: IncomeEntryResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.IncomeEntries, Action.Update)]
    },
    controller.update
  );

  app.delete(
    '/income-entries/:id',
    {
      schema: {
        tags: ['Income Entries'],
        params: IdParamSchema,
        response: {
          204: { type: 'null', description: 'Cancelled' },
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.IncomeEntries, Action.Delete)]
    },
    controller.remove
  );
}
