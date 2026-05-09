import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../../hooks/requireAuth.js';
import { checkPermission } from '../../../hooks/checkPermission.js';
import { Module, Action } from '../../../lib/constants.js';
import { IdParamSchema } from '../../../lib/validation.js';
import { ErrorResponseSchema } from '../../../lib/http-schemas.js';
import {
  ListPaymentMethodsRequestSchema,
  CreatePaymentMethodRequestSchema,
  UpdatePaymentMethodRequestSchema,
  PaymentMethodResponseSchema,
  PaymentMethodListResponseSchema
} from './schema.js';
import * as controller from './controller.js';

export async function paymentMethodsRoutes(app: FastifyInstance) {
  app.get(
    '/payment-methods',
    {
      schema: {
        tags: ['Payment Methods'],
        querystring: ListPaymentMethodsRequestSchema,
        response: {
          200: PaymentMethodListResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.PaymentMethods, Action.View)]
    },
    controller.list
  );

  app.get(
    '/payment-methods/:id',
    {
      schema: {
        tags: ['Payment Methods'],
        params: IdParamSchema,
        response: {
          200: PaymentMethodResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.getById
  );

  app.post(
    '/payment-methods',
    {
      schema: {
        tags: ['Payment Methods'],
        body: CreatePaymentMethodRequestSchema,
        response: {
          201: PaymentMethodResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
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
        body: UpdatePaymentMethodRequestSchema,
        response: {
          200: PaymentMethodResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.PaymentMethods, Action.Update)]
    },
    controller.update
  );

  app.delete(
    '/payment-methods/:id',
    {
      schema: {
        tags: ['Payment Methods'],
        params: IdParamSchema,
        response: {
          204: { type: 'null', description: 'Deleted' },
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.PaymentMethods, Action.Delete)]
    },
    controller.remove
  );
}
