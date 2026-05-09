import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../../../hooks/requireAuth.js';
import { checkPermission } from '../../../../hooks/checkPermission.js';
import { Module, Action } from '../../../../lib/constants.js';
import { IdParamSchema } from '../../../../lib/validation.js';
import { ErrorResponseSchema } from '../../../../lib/http-schemas.js';
import {
  ListExpenseCategoriesRequestSchema,
  CreateExpenseCategoryRequestSchema,
  UpdateExpenseCategoryRequestSchema,
  ExpenseCategoryResponseSchema,
  ExpenseCategoryListResponseSchema
} from './schema.js';
import * as controller from './controller.js';

export async function expenseCategoriesRoutes(app: FastifyInstance) {
  app.get(
    '/expense-categories',
    {
      schema: {
        tags: ['Expense Categories'],
        querystring: ListExpenseCategoriesRequestSchema,
        response: {
          200: ExpenseCategoryListResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.ExpenseCategories, Action.View)]
    },
    controller.list
  );

  app.get(
    '/expense-categories/:id',
    {
      schema: {
        tags: ['Expense Categories'],
        params: IdParamSchema,
        response: {
          200: ExpenseCategoryResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.getById
  );

  app.post(
    '/expense-categories',
    {
      schema: {
        tags: ['Expense Categories'],
        body: CreateExpenseCategoryRequestSchema,
        response: {
          201: ExpenseCategoryResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.ExpenseCategories, Action.Create)]
    },
    controller.create
  );

  app.patch(
    '/expense-categories/:id',
    {
      schema: {
        tags: ['Expense Categories'],
        params: IdParamSchema,
        body: UpdateExpenseCategoryRequestSchema,
        response: {
          200: ExpenseCategoryResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.ExpenseCategories, Action.Update)]
    },
    controller.update
  );

  app.delete(
    '/expense-categories/:id',
    {
      schema: {
        tags: ['Expense Categories'],
        params: IdParamSchema,
        response: {
          204: { type: 'null', description: 'Deleted' },
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.ExpenseCategories, Action.Delete)]
    },
    controller.remove
  );
}
