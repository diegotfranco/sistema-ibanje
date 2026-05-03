import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../hooks/requireAuth';
import { checkPermission } from '../../hooks/checkPermission';
import { Module, Action } from '../../lib/constants';
import * as controller from './controller';

export async function membersRoutes(app: FastifyInstance) {
  app.post(
    '/members',
    { preHandler: [requireAuth, checkPermission(Module.Members, Action.Create)] },
    controller.create
  );

  app.get(
    '/members',
    { preHandler: [requireAuth, checkPermission(Module.Members, Action.View)] },
    controller.list
  );

  app.get('/members/:id', { preHandler: [requireAuth] }, controller.getById);

  app.patch(
    '/members/:id',
    { preHandler: [requireAuth, checkPermission(Module.Members, Action.Update)] },
    controller.update
  );

  app.delete(
    '/members/:id',
    { preHandler: [requireAuth, checkPermission(Module.Members, Action.Delete)] },
    controller.remove
  );
}
