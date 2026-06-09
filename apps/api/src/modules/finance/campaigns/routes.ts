import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../../hooks/requireAuth.js';
import { checkPermission } from '../../../hooks/checkPermission.js';
import { Module, Action } from '../../../lib/constants.js';
import { IdParamSchema } from '../../../lib/validation.js';
import { ErrorResponseSchema } from '../../../lib/http-schemas.js';
import {
  ListCampaignsRequestSchema,
  CreateCampaignRequestSchema,
  UpdateCampaignRequestSchema,
  CampaignResponseSchema,
  CampaignListResponseSchema
} from './schema.js';
import * as controller from './controller.js';

export async function campaignsRoutes(app: FastifyInstance) {
  app.get(
    '/campaigns',
    {
      schema: {
        tags: ['Campaigns'],
        querystring: ListCampaignsRequestSchema,
        response: {
          200: CampaignListResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Campaigns, Action.View)]
    },
    controller.list
  );

  app.get(
    '/campaigns/:id',
    {
      schema: {
        tags: ['Campaigns'],
        params: IdParamSchema,
        response: {
          200: CampaignResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.getById
  );

  app.post(
    '/campaigns',
    {
      schema: {
        tags: ['Campaigns'],
        body: CreateCampaignRequestSchema,
        response: {
          201: CampaignResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Campaigns, Action.Create)]
    },
    controller.create
  );

  app.patch(
    '/campaigns/:id',
    {
      schema: {
        tags: ['Campaigns'],
        params: IdParamSchema,
        body: UpdateCampaignRequestSchema,
        response: {
          200: CampaignResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Campaigns, Action.Update)]
    },
    controller.update
  );

  app.delete(
    '/campaigns/:id',
    {
      schema: {
        tags: ['Campaigns'],
        params: IdParamSchema,
        response: {
          204: { type: 'null', description: 'Deleted' },
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Campaigns, Action.Delete)]
    },
    controller.remove
  );

  app.patch(
    '/campaigns/:id/restore',
    {
      schema: {
        tags: ['Campaigns'],
        params: IdParamSchema,
        response: {
          200: CampaignResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Campaigns, Action.Delete)]
    },
    controller.restore
  );

  app.patch(
    '/campaigns/:id/encerrar',
    {
      schema: {
        tags: ['Campaigns'],
        params: IdParamSchema,
        response: {
          200: CampaignResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Campaigns, Action.Update)]
    },
    controller.encerrar
  );

  app.patch(
    '/campaigns/:id/reabrir',
    {
      schema: {
        tags: ['Campaigns'],
        params: IdParamSchema,
        response: {
          200: CampaignResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Campaigns, Action.Update)]
    },
    controller.reabrir
  );
}
