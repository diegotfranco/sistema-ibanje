import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../../../hooks/requireAuth';
import { checkPermission } from '../../../../hooks/checkPermission';
import { Module, Action } from '../../../../lib/constants';
import * as controller from './controller';

export async function incomeCategoriesRoutes(app: FastifyInstance) {
  app.get(
    '/income-categories',
    { preHandler: [requireAuth, checkPermission(Module.IncomeCategories, Action.View)] },
    controller.list
  );

  app.get('/income-categories/:id', { preHandler: [requireAuth] }, controller.getById);

  app.post(
    '/income-categories',
    { preHandler: [requireAuth, checkPermission(Module.IncomeCategories, Action.Create)] },
    controller.create
  );

  app.patch(
    '/income-categories/:id',
    { preHandler: [requireAuth, checkPermission(Module.IncomeCategories, Action.Update)] },
    controller.update
  );

  app.delete(
    '/income-categories/:id',
    { preHandler: [requireAuth, checkPermission(Module.IncomeCategories, Action.Delete)] },
    controller.remove
  );
}
