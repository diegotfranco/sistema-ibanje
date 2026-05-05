import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../../hooks/requireAuth';
import { checkPermission } from '../../../hooks/checkPermission';
import { Module, Action } from '../../../lib/constants';
import { IdParamSchema } from '../../../lib/validation';
import {
  ListPaymentMethodsRequestSchema,
  CreatePaymentMethodRequestSchema,
  UpdatePaymentMethodRequestSchema
} from './schema';
import * as controller from './controller';

export async function paymentMethodsRoutes(app: FastifyInstance) {
  app.get(
    '/payment-methods',
    {
      schema: { tags: ['Payment Methods'], querystring: ListPaymentMethodsRequestSchema },
      preHandler: [requireAuth, checkPermission(Module.PaymentMethods, Action.View)]
    },
    controller.list
  );

  app.get(
    '/payment-methods/:id',
    { schema: { tags: ['Payment Methods'], params: IdParamSchema }, preHandler: [requireAuth] },
    controller.getById
  );

  app.post(
    '/payment-methods',
    {
      schema: { tags: ['Payment Methods'], body: CreatePaymentMethodRequestSchema },
      preHandler: [requireAuth, checkPermission(Module.PaymentMethods, Action.Create)]
    },
    controller.create
  );

  app.patch(
    '/payment-methods/:id',
    {
      schema: {
        tags: ['Payment Methods'],
        params: IdParamSchema,
        body: UpdatePaymentMethodRequestSchema
      },
      preHandler: [requireAuth, checkPermission(Module.PaymentMethods, Action.Update)]
    },
    controller.update
  );

  app.delete(
    '/payment-methods/:id',
    {
      schema: { tags: ['Payment Methods'], params: IdParamSchema },
      preHandler: [requireAuth, checkPermission(Module.PaymentMethods, Action.Delete)]
    },
    controller.remove
  );
}
