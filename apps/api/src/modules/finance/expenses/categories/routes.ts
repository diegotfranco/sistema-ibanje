import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../../../hooks/requireAuth.js';
import { checkPermission } from '../../../../hooks/checkPermission.js';
import { Module, Action } from '../../../../lib/constants.js';
import { IdParamSchema } from '../../../../lib/validation.js';
import {
  ListExpenseCategoriesRequestSchema,
  CreateExpenseCategoryRequestSchema,
  UpdateExpenseCategoryRequestSchema
} from './schema.js';
import * as controller from './controller.js';

export async function expenseCategoriesRoutes(app: FastifyInstance) {
  app.get(
    '/expense-categories',
    {
      schema: { tags: ['Expense Categories'], querystring: ListExpenseCategoriesRequestSchema },
      preHandler: [requireAuth, checkPermission(Module.ExpenseCategories, Action.View)]
    },
    controller.list
  );

  app.get(
    '/expense-categories/:id',
    { schema: { tags: ['Expense Categories'], params: IdParamSchema }, preHandler: [requireAuth] },
    controller.getById
  );

  app.post(
    '/expense-categories',
    {
      schema: { tags: ['Expense Categories'], body: CreateExpenseCategoryRequestSchema },
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
        body: UpdateExpenseCategoryRequestSchema
      },
      preHandler: [requireAuth, checkPermission(Module.ExpenseCategories, Action.Update)]
    },
    controller.update
  );

  app.delete(
    '/expense-categories/:id',
    {
      schema: { tags: ['Expense Categories'], params: IdParamSchema },
      preHandler: [requireAuth, checkPermission(Module.ExpenseCategories, Action.Delete)]
    },
    controller.remove
  );
}
