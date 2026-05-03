import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../../../hooks/requireAuth';
import { checkPermission } from '../../../../hooks/checkPermission';
import { Module, Action } from '../../../../lib/constants';
import * as controller from './controller';

export async function expenseCategoriesRoutes(app: FastifyInstance) {
  app.get(
    '/expense-categories',
    { preHandler: [requireAuth, checkPermission(Module.ExpenseCategories, Action.View)] },
    controller.list
  );

  app.get('/expense-categories/:id', { preHandler: [requireAuth] }, controller.getById);

  app.post(
    '/expense-categories',
    { preHandler: [requireAuth, checkPermission(Module.ExpenseCategories, Action.Create)] },
    controller.create
  );

  app.patch(
    '/expense-categories/:id',
    { preHandler: [requireAuth, checkPermission(Module.ExpenseCategories, Action.Update)] },
    controller.update
  );

  app.delete(
    '/expense-categories/:id',
    { preHandler: [requireAuth, checkPermission(Module.ExpenseCategories, Action.Delete)] },
    controller.remove
  );
}
