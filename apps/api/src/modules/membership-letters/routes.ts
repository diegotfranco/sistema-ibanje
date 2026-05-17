import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../hooks/requireAuth.js';
import { checkPermission } from '../../hooks/checkPermission.js';
import { Module, Action } from '../../lib/constants.js';
import { IdParamSchema } from '../../lib/validation.js';
import { ErrorResponseSchema } from '../../lib/http-schemas.js';
import {
  ListMembershipLettersRequestSchema,
  CreateMembershipLetterRequestSchema,
  UpdateMembershipLetterRequestSchema,
  MembershipLetterResponseSchema,
  MembershipLetterListResponseSchema
} from './schema.js';
import * as controller from './controller.js';

export async function membershipLettersRoutes(app: FastifyInstance) {
  app.post(
    '/membership-letters',
    {
      schema: {
        tags: ['Membership Letters'],
        body: CreateMembershipLetterRequestSchema,
        response: {
          201: MembershipLetterResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.MembershipLetters, Action.Create)]
    },
    controller.create
  );

  app.get(
    '/membership-letters',
    {
      schema: {
        tags: ['Membership Letters'],
        querystring: ListMembershipLettersRequestSchema,
        response: {
          200: MembershipLetterListResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.MembershipLetters, Action.View)]
    },
    controller.list
  );

  app.get(
    '/membership-letters/:id',
    {
      schema: {
        tags: ['Membership Letters'],
        params: IdParamSchema,
        response: {
          200: MembershipLetterResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.getById
  );

  app.get(
    '/membership-letters/:id/render',
    {
      schema: {
        tags: ['Membership Letters'],
        params: IdParamSchema,
        response: {
          200: { type: 'string' },
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.render
  );

  app.patch(
    '/membership-letters/:id',
    {
      schema: {
        tags: ['Membership Letters'],
        params: IdParamSchema,
        body: UpdateMembershipLetterRequestSchema,
        response: {
          200: MembershipLetterResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.MembershipLetters, Action.Update)]
    },
    controller.update
  );

  app.delete(
    '/membership-letters/:id',
    {
      schema: {
        tags: ['Membership Letters'],
        params: IdParamSchema,
        response: {
          204: { type: 'null', description: 'Deleted' },
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.MembershipLetters, Action.Delete)]
    },
    controller.remove
  );
}
