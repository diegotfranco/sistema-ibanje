import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../hooks/requireAuth';
import { checkPermission } from '../../hooks/checkPermission';
import { Module, Action } from '../../lib/constants';
import * as controller from './controller';

export async function usersRoutes(app: FastifyInstance) {
  app.post(
    '/users',
    { preHandler: [requireAuth, checkPermission(Module.Users, Action.Create)] },
    controller.create
  );

  app.get(
    '/users',
    { preHandler: [requireAuth, checkPermission(Module.Users, Action.View)] },
    controller.list
  );

  app.get('/users/:id', { preHandler: [requireAuth] }, controller.getById);

  app.patch('/users/:id', { preHandler: [requireAuth] }, controller.update);

  app.delete(
    '/users/:id',
    { preHandler: [requireAuth, checkPermission(Module.Users, Action.Delete)] },
    controller.remove
  );

  app.patch('/users/:id/password', { preHandler: [requireAuth] }, controller.changePassword);

  app.patch(
    '/users/:id/approve',
    { preHandler: [requireAuth, checkPermission(Module.Users, Action.Update)] },
    controller.approve
  );

  app.get(
    '/users/:id/permissions',
    { preHandler: [requireAuth, checkPermission(Module.Users, Action.View)] },
    controller.getPermissions
  );

  app.put(
    '/users/:id/permissions',
    { preHandler: [requireAuth, checkPermission(Module.Users, Action.Update)] },
    controller.setPermissions
  );
}
