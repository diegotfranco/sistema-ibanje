import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../../../hooks/requireAuth';
import { checkPermission } from '../../../../hooks/checkPermission';
import { Module, Action } from '../../../../lib/constants';
import { IdParamSchema } from '../../../../lib/validation';
import {
  ListIncomeEntriesRequestSchema,
  CreateIncomeEntryRequestSchema,
  UpdateIncomeEntryRequestSchema,
} from './schema';
import * as controller from './controller';

export async function incomeEntriesRoutes(app: FastifyInstance) {
  app.get(
    '/income-entries',
    {
      schema: { tags: ['Income Entries'], querystring: ListIncomeEntriesRequestSchema },
      preHandler: [requireAuth, checkPermission(Module.IncomeEntries, Action.View)],
    },
    controller.list
  );

  app.get(
    '/income-entries/:id',
    { schema: { tags: ['Income Entries'], params: IdParamSchema }, preHandler: [requireAuth] },
    controller.getById
  );

  app.post(
    '/income-entries',
    {
      schema: { tags: ['Income Entries'], body: CreateIncomeEntryRequestSchema },
      preHandler: [requireAuth, checkPermission(Module.IncomeEntries, Action.Create)],
    },
    controller.create
  );

  app.patch(
    '/income-entries/:id',
    {
      schema: { tags: ['Income Entries'], params: IdParamSchema, body: UpdateIncomeEntryRequestSchema },
      preHandler: [requireAuth, checkPermission(Module.IncomeEntries, Action.Update)],
    },
    controller.update
  );

  app.delete(
    '/income-entries/:id',
    {
      schema: { tags: ['Income Entries'], params: IdParamSchema },
      preHandler: [requireAuth, checkPermission(Module.IncomeEntries, Action.Delete)],
    },
    controller.remove
  );
}
