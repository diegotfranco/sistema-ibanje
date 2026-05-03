import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../../hooks/requireAuth';
import { checkPermission } from '../../../hooks/checkPermission';
import { Module, Action } from '../../../lib/constants';
import * as controller from './controller';

export async function paymentMethodsRoutes(app: FastifyInstance) {
  app.get(
    '/payment-methods',
    { preHandler: [requireAuth, checkPermission(Module.PaymentMethods, Action.View)] },
    controller.list
  );

  app.get('/payment-methods/:id', { preHandler: [requireAuth] }, controller.getById);

  app.post(
    '/payment-methods',
    { preHandler: [requireAuth, checkPermission(Module.PaymentMethods, Action.Create)] },
    controller.create
  );

  app.patch(
    '/payment-methods/:id',
    { preHandler: [requireAuth, checkPermission(Module.PaymentMethods, Action.Update)] },
    controller.update
  );

  app.delete(
    '/payment-methods/:id',
    { preHandler: [requireAuth, checkPermission(Module.PaymentMethods, Action.Delete)] },
    controller.remove
  );
}
