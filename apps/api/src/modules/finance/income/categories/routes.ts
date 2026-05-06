import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../../../hooks/requireAuth.js';
import { checkPermission } from '../../../../hooks/checkPermission.js';
import { Module, Action } from '../../../../lib/constants.js';
import { IdParamSchema } from '../../../../lib/validation.js';
import {
  ListIncomeCategoriesRequestSchema,
  CreateIncomeCategoryRequestSchema,
  UpdateIncomeCategoryRequestSchema
} from './schema.js';
import * as controller from './controller.js';

export async function incomeCategoriesRoutes(app: FastifyInstance) {
  app.get(
    '/income-categories',
    {
      schema: { tags: ['Income Categories'], querystring: ListIncomeCategoriesRequestSchema },
      preHandler: [requireAuth, checkPermission(Module.IncomeCategories, Action.View)]
    },
    controller.list
  );

  app.get(
    '/income-categories/:id',
    { schema: { tags: ['Income Categories'], params: IdParamSchema }, preHandler: [requireAuth] },
    controller.getById
  );

  app.post(
    '/income-categories',
    {
      schema: { tags: ['Income Categories'], body: CreateIncomeCategoryRequestSchema },
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
        body: UpdateIncomeCategoryRequestSchema
      },
      preHandler: [requireAuth, checkPermission(Module.IncomeCategories, Action.Update)]
    },
    controller.update
  );

  app.delete(
    '/income-categories/:id',
    {
      schema: { tags: ['Income Categories'], params: IdParamSchema },
      preHandler: [requireAuth, checkPermission(Module.IncomeCategories, Action.Delete)]
    },
    controller.remove
  );
}
