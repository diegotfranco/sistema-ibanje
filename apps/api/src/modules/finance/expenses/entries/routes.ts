import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../../../hooks/requireAuth';
import { checkPermission } from '../../../../hooks/checkPermission';
import { Module, Action } from '../../../../lib/constants';
import { IdParamSchema } from '../../../../lib/validation';
import {
  ListExpenseEntriesRequestSchema,
  CreateExpenseEntryRequestSchema,
  UpdateExpenseEntryRequestSchema,
} from './schema';
import * as controller from './controller';

export async function expenseEntriesRoutes(app: FastifyInstance) {
  app.get(
    '/expense-entries',
    {
      schema: { tags: ['Expense Entries'], querystring: ListExpenseEntriesRequestSchema },
      preHandler: [requireAuth, checkPermission(Module.ExpenseEntries, Action.View)],
    },
    controller.list
  );

  app.get(
    '/expense-entries/:id',
    { schema: { tags: ['Expense Entries'], params: IdParamSchema }, preHandler: [requireAuth] },
    controller.getById
  );

  app.post(
    '/expense-entries',
    {
      schema: { tags: ['Expense Entries'], body: CreateExpenseEntryRequestSchema },
      preHandler: [requireAuth, checkPermission(Module.ExpenseEntries, Action.Create)],
    },
    controller.create
  );

  app.patch(
    '/expense-entries/:id',
    {
      schema: { tags: ['Expense Entries'], params: IdParamSchema, body: UpdateExpenseEntryRequestSchema },
      preHandler: [requireAuth, checkPermission(Module.ExpenseEntries, Action.Update)],
    },
    controller.update
  );

  app.delete(
    '/expense-entries/:id',
    {
      schema: { tags: ['Expense Entries'], params: IdParamSchema },
      preHandler: [requireAuth, checkPermission(Module.ExpenseEntries, Action.Delete)],
    },
    controller.remove
  );

  // Receipt sub-resource — accepts multipart/form-data with a single 'receipt' file field
  app.post(
    '/expense-entries/:id/receipt',
    {
      schema: { tags: ['Expense Entries'], params: IdParamSchema },
      preHandler: [requireAuth, checkPermission(Module.ExpenseEntries, Action.Update)],
    },
    controller.uploadReceipt
  );

  app.delete(
    '/expense-entries/:id/receipt',
    {
      schema: { tags: ['Expense Entries'], params: IdParamSchema },
      preHandler: [requireAuth, checkPermission(Module.ExpenseEntries, Action.Update)],
    },
    controller.deleteReceipt
  );
}
