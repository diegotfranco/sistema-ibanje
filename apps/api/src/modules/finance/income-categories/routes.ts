import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../../hooks/requireAuth.js';
import { checkPermission } from '../../../hooks/checkPermission.js';
import * as controller from './controller.js';

export async function incomeCategoriesRoutes(app: FastifyInstance) {
  app.get(
    '/income-categories',
    { preHandler: [requireAuth, checkPermission('Categorias de Entradas', 'Acessar')] },
    controller.list
  );

  app.get('/income-categories/:id', { preHandler: [requireAuth] }, controller.getById);

  app.post(
    '/income-categories',
    { preHandler: [requireAuth, checkPermission('Categorias de Entradas', 'Cadastrar')] },
    controller.create
  );

  app.patch(
    '/income-categories/:id',
    { preHandler: [requireAuth, checkPermission('Categorias de Entradas', 'Editar')] },
    controller.update
  );

  app.delete(
    '/income-categories/:id',
    { preHandler: [requireAuth, checkPermission('Categorias de Entradas', 'Remover')] },
    controller.remove
  );
}
