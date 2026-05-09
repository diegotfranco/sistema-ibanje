import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../../../hooks/requireAuth.js';
import { checkPermission } from '../../../../hooks/checkPermission.js';
import { Module, Action } from '../../../../lib/constants.js';
import { IdParamSchema } from '../../../../lib/validation.js';
import { ErrorResponseSchema } from '../../../../lib/http-schemas.js';
import {
  ListExpenseEntriesRequestSchema,
  CreateExpenseEntryRequestSchema,
  UpdateExpenseEntryRequestSchema,
  ExpenseEntryResponseSchema,
  ExpenseEntryListResponseSchema
} from './schema.js';
import * as controller from './controller.js';

export async function expenseEntriesRoutes(app: FastifyInstance) {
  app.get(
    '/expense-entries',
    {
      schema: {
        tags: ['Expense Entries'],
        querystring: ListExpenseEntriesRequestSchema,
        response: {
          200: ExpenseEntryListResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.ExpenseEntries, Action.View)]
    },
    controller.list
  );

  app.get(
    '/expense-entries/:id',
    {
      schema: {
        tags: ['Expense Entries'],
        params: IdParamSchema,
        response: {
          200: ExpenseEntryResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.getById
  );

  app.post(
    '/expense-entries',
    {
      schema: {
        tags: ['Expense Entries'],
        body: CreateExpenseEntryRequestSchema,
        response: {
          201: ExpenseEntryResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.ExpenseEntries, Action.Create)]
    },
    controller.create
  );

  app.patch(
    '/expense-entries/:id',
    {
      schema: {
        tags: ['Expense Entries'],
        params: IdParamSchema,
        body: UpdateExpenseEntryRequestSchema,
        response: {
          200: ExpenseEntryResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.ExpenseEntries, Action.Update)]
    },
    controller.update
  );

  app.delete(
    '/expense-entries/:id',
    {
      schema: {
        tags: ['Expense Entries'],
        params: IdParamSchema,
        response: {
          204: { type: 'null', description: 'Cancelled' },
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.ExpenseEntries, Action.Delete)]
    },
    controller.remove
  );

  // Receipt sub-resource — accepts multipart/form-data with a single 'receipt' file field
  app.post(
    '/expense-entries/:id/receipt',
    {
      schema: {
        tags: ['Expense Entries'],
        params: IdParamSchema,
        response: {
          200: ExpenseEntryResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.ExpenseEntries, Action.Update)]
    },
    controller.uploadReceipt
  );

  app.delete(
    '/expense-entries/:id/receipt',
    {
      schema: {
        tags: ['Expense Entries'],
        params: IdParamSchema,
        response: {
          204: { type: 'null', description: 'Receipt removed' },
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.ExpenseEntries, Action.Update)]
    },
    controller.deleteReceipt
  );
}
