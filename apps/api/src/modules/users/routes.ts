import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../hooks/requireAuth';
import { checkPermission } from '../../hooks/checkPermission';
import * as controller from './controller';

export async function usersRoutes(app: FastifyInstance) {
  app.post(
    '/users',
    { preHandler: [requireAuth, checkPermission('Usuários', 'Cadastrar')] },
    controller.create
  );

  app.get(
    '/users',
    { preHandler: [requireAuth, checkPermission('Usuários', 'Acessar')] },
    controller.list
  );

  app.get('/users/:id', { preHandler: [requireAuth] }, controller.getById);

  app.patch('/users/:id', { preHandler: [requireAuth] }, controller.update);

  app.delete(
    '/users/:id',
    { preHandler: [requireAuth, checkPermission('Usuários', 'Remover')] },
    controller.remove
  );

  app.patch('/users/:id/password', { preHandler: [requireAuth] }, controller.changePassword);

  app.patch(
    '/users/:id/approve',
    { preHandler: [requireAuth, checkPermission('Usuários', 'Editar')] },
    controller.approve
  );

  app.get(
    '/users/:id/permissions',
    { preHandler: [requireAuth, checkPermission('Usuários', 'Acessar')] },
    controller.getPermissions
  );

  app.put(
    '/users/:id/permissions',
    { preHandler: [requireAuth, checkPermission('Usuários', 'Editar')] },
    controller.setPermissions
  );
}
