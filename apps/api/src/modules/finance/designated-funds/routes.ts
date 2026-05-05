import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../../hooks/requireAuth';
import { checkPermission } from '../../../hooks/checkPermission';
import { Module, Action } from '../../../lib/constants';
import { IdParamSchema } from '../../../lib/validation';
import {
  ListDesignatedFundsRequestSchema,
  CreateDesignatedFundRequestSchema,
  UpdateDesignatedFundRequestSchema
} from './schema';
import * as controller from './controller';

export async function designatedFundsRoutes(app: FastifyInstance) {
  app.get(
    '/designated-funds',
    {
      schema: { tags: ['Designated Funds'], querystring: ListDesignatedFundsRequestSchema },
      preHandler: [requireAuth, checkPermission(Module.DesignatedFunds, Action.View)]
    },
    controller.list
  );

  app.get(
    '/designated-funds/:id',
    { schema: { tags: ['Designated Funds'], params: IdParamSchema }, preHandler: [requireAuth] },
    controller.getById
  );

  app.post(
    '/designated-funds',
    {
      schema: { tags: ['Designated Funds'], body: CreateDesignatedFundRequestSchema },
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
        body: UpdateDesignatedFundRequestSchema
      },
      preHandler: [requireAuth, checkPermission(Module.DesignatedFunds, Action.Update)]
    },
    controller.update
  );

  app.delete(
    '/designated-funds/:id',
    {
      schema: { tags: ['Designated Funds'], params: IdParamSchema },
      preHandler: [requireAuth, checkPermission(Module.DesignatedFunds, Action.Delete)]
    },
    controller.remove
  );
}
