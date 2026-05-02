import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../../hooks/requireAuth.js';
import { checkPermission } from '../../../hooks/checkPermission.js';
import * as controller from './controller.js';

export async function designatedFundsRoutes(app: FastifyInstance) {
  app.get(
    '/designated-funds',
    { preHandler: [requireAuth, checkPermission('Caixa', 'Acessar')] },
    controller.list
  );

  app.get('/designated-funds/:id', { preHandler: [requireAuth] }, controller.getById);

  app.post(
    '/designated-funds',
    { preHandler: [requireAuth, checkPermission('Caixa', 'Cadastrar')] },
    controller.create
  );

  app.patch(
    '/designated-funds/:id',
    { preHandler: [requireAuth, checkPermission('Caixa', 'Editar')] },
    controller.update
  );

  app.delete(
    '/designated-funds/:id',
    { preHandler: [requireAuth, checkPermission('Caixa', 'Remover')] },
    controller.remove
  );
}
