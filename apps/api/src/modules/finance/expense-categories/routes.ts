import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../../hooks/requireAuth.js';
import { checkPermission } from '../../../hooks/checkPermission.js';
import * as controller from './controller.js';

export async function expenseCategoriesRoutes(app: FastifyInstance) {
  app.get(
    '/expense-categories',
    { preHandler: [requireAuth, checkPermission('Categorias de Saídas', 'Acessar')] },
    controller.list
  );

  app.get('/expense-categories/:id', { preHandler: [requireAuth] }, controller.getById);

  app.post(
    '/expense-categories',
    { preHandler: [requireAuth, checkPermission('Categorias de Saídas', 'Cadastrar')] },
    controller.create
  );

  app.patch(
    '/expense-categories/:id',
    { preHandler: [requireAuth, checkPermission('Categorias de Saídas', 'Editar')] },
    controller.update
  );

  app.delete(
    '/expense-categories/:id',
    { preHandler: [requireAuth, checkPermission('Categorias de Saídas', 'Remover')] },
    controller.remove
  );
}
