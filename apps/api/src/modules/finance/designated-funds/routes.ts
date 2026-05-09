import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../../hooks/requireAuth.js';
import { checkPermission } from '../../../hooks/checkPermission.js';
import { Module, Action } from '../../../lib/constants.js';
import { IdParamSchema } from '../../../lib/validation.js';
import { ErrorResponseSchema } from '../../../lib/http-schemas.js';
import {
  ListDesignatedFundsRequestSchema,
  CreateDesignatedFundRequestSchema,
  UpdateDesignatedFundRequestSchema,
  DesignatedFundResponseSchema,
  DesignatedFundListResponseSchema
} from './schema.js';
import * as controller from './controller.js';

export async function designatedFundsRoutes(app: FastifyInstance) {
  app.get(
    '/designated-funds',
    {
      schema: {
        tags: ['Designated Funds'],
        querystring: ListDesignatedFundsRequestSchema,
        response: {
          200: DesignatedFundListResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.DesignatedFunds, Action.View)]
    },
    controller.list
  );

  app.get(
    '/designated-funds/:id',
    {
      schema: {
        tags: ['Designated Funds'],
        params: IdParamSchema,
        response: {
          200: DesignatedFundResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.getById
  );

  app.post(
    '/designated-funds',
    {
      schema: {
        tags: ['Designated Funds'],
        body: CreateDesignatedFundRequestSchema,
        response: {
          201: DesignatedFundResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.DesignatedFunds, Action.Create)]
    },
    controller.create
  );

  app.patch(
    '/designated-funds/:id',
    {
      schema: {
        tags: ['Designated Funds'],
        params: IdParamSchema,
        body: UpdateDesignatedFundRequestSchema,
        response: {
          200: DesignatedFundResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.DesignatedFunds, Action.Update)]
    },
    controller.update
  );

  app.delete(
    '/designated-funds/:id',
    {
      schema: {
        tags: ['Designated Funds'],
        params: IdParamSchema,
        response: {
          204: { type: 'null', description: 'Deleted' },
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.DesignatedFunds, Action.Delete)]
    },
    controller.remove
  );
}
