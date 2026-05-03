import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../../../hooks/requireAuth';
import { checkPermission } from '../../../../hooks/checkPermission';
import { Module, Action } from '../../../../lib/constants';
import { IdParamSchema } from '../../../../lib/validation';
import {
  ListExpenseCategoriesRequestSchema,
  CreateExpenseCategoryRequestSchema,
  UpdateExpenseCategoryRequestSchema,
} from './schema';
import * as controller from './controller';

export async function expenseCategoriesRoutes(app: FastifyInstance) {
  app.get(
    '/expense-categories',
    {
      schema: { tags: ['Expense Categories'], querystring: ListExpenseCategoriesRequestSchema },
      preHandler: [requireAuth, checkPermission(Module.ExpenseCategories, Action.View)],
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
      preHandler: [requireAuth, checkPermission(Module.ExpenseCategories, Action.Create)],
    },
    controller.create
  );

  app.patch(
    '/expense-categories/:id',
    {
      schema: { tags: ['Expense Categories'], params: IdParamSchema, body: UpdateExpenseCategoryRequestSchema },
      preHandler: [requireAuth, checkPermission(Module.ExpenseCategories, Action.Update)],
    },
    controller.update
  );

  app.delete(
    '/expense-categories/:id',
    {
      schema: { tags: ['Expense Categories'], params: IdParamSchema },
      preHandler: [requireAuth, checkPermission(Module.ExpenseCategories, Action.Delete)],
    },
    controller.remove
  );
}
