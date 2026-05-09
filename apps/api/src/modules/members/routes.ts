import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../hooks/requireAuth.js';
import { checkPermission } from '../../hooks/checkPermission.js';
import { Module, Action } from '../../lib/constants.js';
import { IdParamSchema } from '../../lib/validation.js';
import { ErrorResponseSchema } from '../../lib/http-schemas.js';
import {
  ListMembersRequestSchema,
  CreateMemberRequestSchema,
  UpdateMemberRequestSchema,
  MemberResponseSchema,
  MemberListResponseSchema
} from './schema.js';
import * as controller from './controller.js';

export async function membersRoutes(app: FastifyInstance) {
  app.post(
    '/members',
    {
      schema: {
        tags: ['Members'],
        body: CreateMemberRequestSchema,
        response: {
          201: MemberResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Members, Action.Create)]
    },
    controller.create
  );

  app.get(
    '/members',
    {
      schema: {
        tags: ['Members'],
        querystring: ListMembersRequestSchema,
        response: {
          200: MemberListResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Members, Action.View)]
    },
    controller.list
  );

  app.get(
    '/members/:id',
    {
      schema: {
        tags: ['Members'],
        params: IdParamSchema,
        response: {
          200: MemberResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.getById
  );

  app.patch(
    '/members/:id',
    {
      schema: {
        tags: ['Members'],
        params: IdParamSchema,
        body: UpdateMemberRequestSchema,
        response: {
          200: MemberResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Members, Action.Update)]
    },
    controller.update
  );

  app.delete(
    '/members/:id',
    {
      schema: {
        tags: ['Members'],
        params: IdParamSchema,
        response: {
          204: { type: 'null', description: 'Deleted' },
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Members, Action.Delete)]
    },
    controller.remove
  );
}
