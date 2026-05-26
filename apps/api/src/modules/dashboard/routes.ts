import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../hooks/requireAuth.js';
import { checkPermission } from '../../hooks/checkPermission.js';
import { Module, Action } from '../../lib/constants.js';
import { MonthQueryRequestSchema, DashboardResponseSchema } from './schema.js';
import { ErrorResponseSchema } from '../../lib/http-schemas.js';
import * as controller from './controller.js';

export async function dashboardRoutes(app: FastifyInstance) {
  app.get(
    '/dashboard',
    {
      schema: {
        tags: ['Dashboard'],
        querystring: MonthQueryRequestSchema,
        response: {
          200: DashboardResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Dashboard, Action.View)]
    },
    controller.getDashboard
  );
}
