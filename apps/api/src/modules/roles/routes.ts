import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../hooks/requireAuth';
import { checkPermission } from '../../hooks/checkPermission';
import { Module, Action } from '../../lib/constants';
import * as controller from './controller';

export async function rolesRoutes(app: FastifyInstance) {
  app.get(
    '/roles',
    { preHandler: [requireAuth, checkPermission(Module.Roles, Action.View)] },
    controller.list
  );

  app.get('/roles/:id', { preHandler: [requireAuth] }, controller.getById);

  app.post(
    '/roles',
    { preHandler: [requireAuth, checkPermission(Module.Roles, Action.Create)] },
    controller.create
  );

  app.patch(
    '/roles/:id',
    { preHandler: [requireAuth, checkPermission(Module.Roles, Action.Update)] },
    controller.update
  );

  app.delete(
    '/roles/:id',
    { preHandler: [requireAuth, checkPermission(Module.Roles, Action.Delete)] },
    controller.remove
  );

  app.get('/roles/:id/permissions', { preHandler: [requireAuth] }, controller.getPermissions);

  app.put(
    '/roles/:id/permissions',
    { preHandler: [requireAuth, checkPermission(Module.Roles, Action.Update)] },
    controller.setPermissions
  );

  // Reference endpoints — used by the UI to populate the permission assignment form
  app.get('/modules', { preHandler: [requireAuth] }, controller.getModules);
  app.get('/permission-types', { preHandler: [requireAuth] }, controller.getPermissionTypes);
}
