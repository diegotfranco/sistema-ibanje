import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../hooks/requireAuth.js';
import { checkPermission } from '../../hooks/checkPermission.js';
import { Module, Action } from '../../lib/constants.js';
import { IdParamSchema } from '../../lib/validation.js';
import { ErrorResponseSchema } from '../../lib/http-schemas.js';
import {
  ListUsersRequestSchema,
  CreateUserRequestSchema,
  UpdateUserRequestSchema,
  UpdatePasswordRequestSchema,
  UpdatePermissionsRequestSchema,
  UserResponseSchema,
  UserListResponseSchema,
  UserPermissionsResponseSchema
} from './schema.js';
import * as controller from './controller.js';

export async function usersRoutes(app: FastifyInstance) {
  app.post(
    '/users',
    {
      schema: {
        tags: ['Users'],
        body: CreateUserRequestSchema,
        response: {
          201: UserResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Users, Action.Create)]
    },
    controller.create
  );

  app.get(
    '/users',
    {
      schema: {
        tags: ['Users'],
        querystring: ListUsersRequestSchema,
        response: {
          200: UserListResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Users, Action.View)]
    },
    controller.list
  );

  app.get(
    '/users/:id',
    {
      schema: {
        tags: ['Users'],
        params: IdParamSchema,
        response: {
          200: UserResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.getById
  );

  app.patch(
    '/users/:id',
    {
      schema: {
        tags: ['Users'],
        params: IdParamSchema,
        body: UpdateUserRequestSchema,
        response: {
          200: UserResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.update
  );

  app.delete(
    '/users/:id',
    {
      schema: {
        tags: ['Users'],
        params: IdParamSchema,
        response: {
          204: { type: 'null', description: 'Deleted' },
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Users, Action.Delete)]
    },
    controller.remove
  );

  app.patch(
    '/users/:id/password',
    {
      schema: {
        tags: ['Users'],
        params: IdParamSchema,
        body: UpdatePasswordRequestSchema,
        response: {
          204: { type: 'null', description: 'Password changed' },
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.changePassword
  );

  app.patch(
    '/users/:id/approve',
    {
      schema: {
        tags: ['Users'],
        params: IdParamSchema,
        response: {
          200: UserResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Users, Action.Update)]
    },
    controller.approve
  );

  app.get(
    '/users/:id/permissions',
    {
      schema: {
        tags: ['Users'],
        params: IdParamSchema,
        response: {
          200: UserPermissionsResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Users, Action.View)]
    },
    controller.getPermissions
  );

  app.put(
    '/users/:id/permissions',
    {
      schema: {
        tags: ['Users'],
        params: IdParamSchema,
        body: UpdatePermissionsRequestSchema,
        response: {
          204: { type: 'null', description: 'Permissions updated' },
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Users, Action.Update)]
    },
    controller.setPermissions
  );
}
