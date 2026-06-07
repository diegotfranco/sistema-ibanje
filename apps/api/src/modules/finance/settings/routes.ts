import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../../hooks/requireAuth.js';
import { checkPermission } from '../../../hooks/checkPermission.js';
import { Module, Action } from '../../../lib/constants.js';
import { ErrorResponseSchema } from '../../../lib/http-schemas.js';
import { FinanceSettingsResponseSchema, UpdateFinanceSettingsRequestSchema } from './schema.js';
import * as controller from './controller.js';

export async function financeSettingsRoutes(app: FastifyInstance) {
  app.get(
    '/finance-settings',
    {
      schema: {
        tags: ['Finance Settings'],
        response: {
          200: FinanceSettingsResponseSchema,
          401: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.getSettings
  );

  app.put(
    '/finance-settings',
    {
      schema: {
        tags: ['Finance Settings'],
        body: UpdateFinanceSettingsRequestSchema,
        response: {
          200: FinanceSettingsResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.ChurchSettings, Action.Update)]
    },
    controller.update
  );
}
