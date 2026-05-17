import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../hooks/requireAuth.js';
import { checkPermission } from '../../hooks/checkPermission.js';
import { Module, Action } from '../../lib/constants.js';
import { IdParamSchema } from '../../lib/validation.js';
import { ErrorResponseSchema } from '../../lib/http-schemas.js';
import {
  ListAttendersRequestSchema,
  CreateAttenderRequestSchema,
  UpdateAttenderRequestSchema,
  AttenderResponseSchema,
  AttenderListResponseSchema
} from './schema.js';
import { IncomeEntryListResponseSchema } from '../finance/income/entries/schema.js';
import * as controller from './controller.js';

export async function attendersRoutes(app: FastifyInstance) {
  app.post(
    '/attenders',
    {
      schema: {
        tags: ['Attenders'],
        body: CreateAttenderRequestSchema,
        response: {
          201: AttenderResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Attenders, Action.Create)]
    },
    controller.create
  );

  app.get(
    '/attenders',
    {
      schema: {
        tags: ['Attenders'],
        querystring: ListAttendersRequestSchema,
        response: {
          200: AttenderListResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Attenders, Action.View)]
    },
    controller.list
  );

  app.get(
    '/attenders/:id',
    {
      schema: {
        tags: ['Attenders'],
        params: IdParamSchema,
        response: {
          200: AttenderResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.getById
  );

  app.patch(
    '/attenders/:id',
    {
      schema: {
        tags: ['Attenders'],
        params: IdParamSchema,
        body: UpdateAttenderRequestSchema,
        response: {
          200: AttenderResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Attenders, Action.Update)]
    },
    controller.update
  );

  app.get(
    '/attenders/:id/donations',
    {
      schema: {
        tags: ['Attenders'],
        params: IdParamSchema,
        querystring: ListAttendersRequestSchema,
        response: {
          200: IncomeEntryListResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.listDonations
  );

  app.delete(
    '/attenders/:id',
    {
      schema: {
        tags: ['Attenders'],
        params: IdParamSchema,
        response: {
          204: { type: 'null', description: 'Deleted' },
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Attenders, Action.Delete)]
    },
    controller.remove
  );
}
