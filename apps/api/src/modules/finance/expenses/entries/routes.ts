import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../../../hooks/requireAuth';
import { checkPermission } from '../../../../hooks/checkPermission';
import { Module, Action } from '../../../../lib/constants';
import * as controller from './controller';

export async function expenseEntriesRoutes(app: FastifyInstance) {
  app.get(
    '/expense-entries',
    { preHandler: [requireAuth, checkPermission(Module.ExpenseEntries, Action.View)] },
    controller.list
  );

  app.get('/expense-entries/:id', { preHandler: [requireAuth] }, controller.getById);

  app.post(
    '/expense-entries',
    { preHandler: [requireAuth, checkPermission(Module.ExpenseEntries, Action.Create)] },
    controller.create
  );

  app.patch(
    '/expense-entries/:id',
    { preHandler: [requireAuth, checkPermission(Module.ExpenseEntries, Action.Update)] },
    controller.update
  );

  app.delete(
    '/expense-entries/:id',
    { preHandler: [requireAuth, checkPermission(Module.ExpenseEntries, Action.Delete)] },
    controller.remove
  );
}
