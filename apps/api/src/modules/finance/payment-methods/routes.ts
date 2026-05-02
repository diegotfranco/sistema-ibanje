import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../../hooks/requireAuth.js';
import { checkPermission } from '../../../hooks/checkPermission.js';
import * as controller from './controller.js';

export async function paymentMethodsRoutes(app: FastifyInstance) {
  app.get(
    '/payment-methods',
    { preHandler: [requireAuth, checkPermission('Formas de Pagamento', 'Acessar')] },
    controller.list
  );

  app.get('/payment-methods/:id', { preHandler: [requireAuth] }, controller.getById);

  app.post(
    '/payment-methods',
    { preHandler: [requireAuth, checkPermission('Formas de Pagamento', 'Cadastrar')] },
    controller.create
  );

  app.patch(
    '/payment-methods/:id',
    { preHandler: [requireAuth, checkPermission('Formas de Pagamento', 'Editar')] },
    controller.update
  );

  app.delete(
    '/payment-methods/:id',
    { preHandler: [requireAuth, checkPermission('Formas de Pagamento', 'Remover')] },
    controller.remove
  );
}
