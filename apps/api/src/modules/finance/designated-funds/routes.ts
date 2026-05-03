import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../../hooks/requireAuth';
import { checkPermission } from '../../../hooks/checkPermission';
import { Module, Action } from '../../../lib/constants';
import * as controller from './controller';

export async function designatedFundsRoutes(app: FastifyInstance) {
  app.get(
    '/designated-funds',
    { preHandler: [requireAuth, checkPermission(Module.DesignatedFunds, Action.View)] },
    controller.list
  );

  app.get('/designated-funds/:id', { preHandler: [requireAuth] }, controller.getById);

  app.post(
    '/designated-funds',
    { preHandler: [requireAuth, checkPermission(Module.DesignatedFunds, Action.Create)] },
    controller.create
  );

  app.patch(
    '/designated-funds/:id',
    { preHandler: [requireAuth, checkPermission(Module.DesignatedFunds, Action.Update)] },
    controller.update
  );

  app.delete(
    '/designated-funds/:id',
    { preHandler: [requireAuth, checkPermission(Module.DesignatedFunds, Action.Delete)] },
    controller.remove
  );
}
