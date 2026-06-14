import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../hooks/requireAuth.js';
import { checkPermission } from '../../hooks/checkPermission.js';
import { Module, Action } from '../../lib/constants.js';
import { ErrorResponseSchema } from '../../lib/http-schemas.js';
import { ListAuditRequestSchema, AuditListResponseSchema } from './schema.js';
import * as controller from './controller.js';

export async function auditRoutes(app: FastifyInstance) {
  // Gated by Auditoria.View — admin-only by seed (see service comment).
  app.get(
    '/audit',
    {
      schema: {
        tags: ['Audit'],
        querystring: ListAuditRequestSchema,
        response: {
          200: AuditListResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Audit, Action.View)]
    },
    controller.list
  );
}
