import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../hooks/requireAuth.js';
import { checkPermission } from '../../hooks/checkPermission.js';
import * as controller from './controller.js';

export async function rolesRoutes(app: FastifyInstance) {
  app.get(
    '/roles',
    { preHandler: [requireAuth, checkPermission('Cargos', 'Acessar')] },
    controller.list
  );

  app.get('/roles/:id', { preHandler: [requireAuth] }, controller.getById);

  app.post(
    '/roles',
    { preHandler: [requireAuth, checkPermission('Cargos', 'Cadastrar')] },
    controller.create
  );

  app.patch(
    '/roles/:id',
    { preHandler: [requireAuth, checkPermission('Cargos', 'Editar')] },
    controller.update
  );

  app.delete(
    '/roles/:id',
    { preHandler: [requireAuth, checkPermission('Cargos', 'Remover')] },
    controller.remove
  );

  app.get('/roles/:id/permissions', { preHandler: [requireAuth] }, controller.getPermissions);

  app.put(
    '/roles/:id/permissions',
    { preHandler: [requireAuth, checkPermission('Cargos', 'Editar')] },
    controller.setPermissions
  );

  // Reference endpoints — used by the UI to populate the permission assignment form
  app.get('/modules', { preHandler: [requireAuth] }, controller.getModules);
  app.get('/permission-types', { preHandler: [requireAuth] }, controller.getPermissionTypes);
}
