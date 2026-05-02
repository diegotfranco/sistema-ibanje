import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../hooks/requireAuth.js';
import { checkPermission } from '../../hooks/checkPermission.js';
import * as controller from './controller.js';

export async function membersRoutes(app: FastifyInstance) {
  app.post(
    '/members',
    { preHandler: [requireAuth, checkPermission('Membros', 'Cadastrar')] },
    controller.create
  );

  app.get(
    '/members',
    { preHandler: [requireAuth, checkPermission('Membros', 'Acessar')] },
    controller.list
  );

  app.get('/members/:id', { preHandler: [requireAuth] }, controller.getById);

  app.patch(
    '/members/:id',
    { preHandler: [requireAuth, checkPermission('Membros', 'Editar')] },
    controller.update
  );

  app.delete(
    '/members/:id',
    { preHandler: [requireAuth, checkPermission('Membros', 'Remover')] },
    controller.remove
  );
}
