import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../hooks/requireAuth.js';
import { checkPermission } from '../../hooks/checkPermission.js';
import { Module, Action } from '../../lib/constants.js';
import { IdParamSchema } from '../../lib/validation.js';
import { ErrorResponseSchema } from '../../lib/http-schemas.js';
import {
  ListRolesRequestSchema,
  CreateRoleRequestSchema,
  UpdateRoleRequestSchema,
  SetRolePermissionsRequestSchema,
  RoleResponseSchema,
  RoleListResponseSchema,
  RolePermissionListResponseSchema,
  ModuleListResponseSchema,
  PermissionTypeListResponseSchema
} from './schema.js';
import * as controller from './controller.js';

export async function rolesRoutes(app: FastifyInstance) {
  app.get(
    '/roles',
    {
      schema: {
        tags: ['Roles'],
        querystring: ListRolesRequestSchema,
        response: {
          200: RoleListResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Roles, Action.View)]
    },
    controller.list
  );

  app.get(
    '/roles/:id',
    {
      schema: {
        tags: ['Roles'],
        params: IdParamSchema,
        response: {
          200: RoleResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.getById
  );

  app.post(
    '/roles',
    {
      schema: {
        tags: ['Roles'],
        body: CreateRoleRequestSchema,
        response: {
          201: RoleResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Roles, Action.Create)]
    },
    controller.create
  );

  app.patch(
    '/roles/:id',
    {
      schema: {
        tags: ['Roles'],
        params: IdParamSchema,
        body: UpdateRoleRequestSchema,
        response: {
          200: RoleResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Roles, Action.Update)]
    },
    controller.update
  );

  app.delete(
    '/roles/:id',
    {
      schema: {
        tags: ['Roles'],
        params: IdParamSchema,
        response: {
          204: { type: 'null', description: 'Deleted' },
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Roles, Action.Delete)]
    },
    controller.remove
  );

  app.get(
    '/roles/:id/permissions',
    {
      schema: {
        tags: ['Roles'],
        params: IdParamSchema,
        response: {
          200: RolePermissionListResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.getPermissions
  );

  app.put(
    '/roles/:id/permissions',
    {
      schema: {
        tags: ['Roles'],
        params: IdParamSchema,
        body: SetRolePermissionsRequestSchema,
        response: {
          204: { type: 'null', description: 'Permissions updated' },
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Roles, Action.Update)]
    },
    controller.setPermissions
  );

  app.get(
    '/modules',
    {
      schema: {
        tags: ['Roles'],
        response: {
          200: ModuleListResponseSchema,
          401: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.getModules
  );

  app.get(
    '/permission-types',
    {
      schema: {
        tags: ['Roles'],
        response: {
          200: PermissionTypeListResponseSchema,
          401: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.getPermissionTypes
  );
}
