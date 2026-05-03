import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../../../hooks/requireAuth';
import { checkPermission } from '../../../../hooks/checkPermission';
import { Module, Action } from '../../../../lib/constants';
import * as controller from './controller';

export async function incomeEntriesRoutes(app: FastifyInstance) {
  app.get(
    '/income-entries',
    { preHandler: [requireAuth, checkPermission(Module.IncomeEntries, Action.View)] },
    controller.list
  );

  app.get('/income-entries/:id', { preHandler: [requireAuth] }, controller.getById);

  app.post(
    '/income-entries',
    { preHandler: [requireAuth, checkPermission(Module.IncomeEntries, Action.Create)] },
    controller.create
  );

  app.patch(
    '/income-entries/:id',
    { preHandler: [requireAuth, checkPermission(Module.IncomeEntries, Action.Update)] },
    controller.update
  );

  app.delete(
    '/income-entries/:id',
    { preHandler: [requireAuth, checkPermission(Module.IncomeEntries, Action.Delete)] },
    controller.remove
  );
}
