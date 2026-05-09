import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../../../hooks/requireAuth.js';
import { checkPermission } from '../../../../hooks/checkPermission.js';
import { Module, Action } from '../../../../lib/constants.js';
import { IdParamSchema } from '../../../../lib/validation.js';
import { ErrorResponseSchema } from '../../../../lib/http-schemas.js';
import {
  ListIncomeCategoriesRequestSchema,
  CreateIncomeCategoryRequestSchema,
  UpdateIncomeCategoryRequestSchema,
  IncomeCategoryResponseSchema,
  IncomeCategoryListResponseSchema
} from './schema.js';
import * as controller from './controller.js';

export async function incomeCategoriesRoutes(app: FastifyInstance) {
  app.get(
    '/income-categories',
    {
      schema: {
        tags: ['Income Categories'],
        querystring: ListIncomeCategoriesRequestSchema,
        response: {
          200: IncomeCategoryListResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.IncomeCategories, Action.View)]
    },
    controller.list
  );

  app.get(
    '/income-categories/:id',
    {
      schema: {
        tags: ['Income Categories'],
        params: IdParamSchema,
        response: {
          200: IncomeCategoryResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.getById
  );

  app.post(
    '/income-categories',
    {
      schema: {
        tags: ['Income Categories'],
        body: CreateIncomeCategoryRequestSchema,
        response: {
          201: IncomeCategoryResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.IncomeCategories, Action.Create)]
    },
    controller.create
  );

  app.patch(
    '/income-categories/:id',
    {
      schema: {
        tags: ['Income Categories'],
        params: IdParamSchema,
        body: UpdateIncomeCategoryRequestSchema,
        response: {
          200: IncomeCategoryResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.IncomeCategories, Action.Update)]
    },
    controller.update
  );

  app.delete(
    '/income-categories/:id',
    {
      schema: {
        tags: ['Income Categories'],
        params: IdParamSchema,
        response: {
          204: { type: 'null', description: 'Deleted' },
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.IncomeCategories, Action.Delete)]
    },
    controller.remove
  );
}
