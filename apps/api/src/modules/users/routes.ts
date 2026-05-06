import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../hooks/requireAuth.js';
import { checkPermission } from '../../hooks/checkPermission.js';
import { Module, Action } from '../../lib/constants.js';
import { IdParamSchema } from '../../lib/validation.js';
import {
  ListUsersRequestSchema,
  CreateUserRequestSchema,
  UpdateUserRequestSchema,
  UpdatePasswordRequestSchema,
  UpdatePermissionsRequestSchema
} from './schema.js';
import * as controller from './controller.js';

export async function usersRoutes(app: FastifyInstance) {
  app.post(
    '/users',
    {
      schema: { tags: ['Users'], body: CreateUserRequestSchema },
      preHandler: [requireAuth, checkPermission(Module.Users, Action.Create)]
    },
    controller.create
  );

  app.get(
    '/users',
    {
      schema: { tags: ['Users'], querystring: ListUsersRequestSchema },
      preHandler: [requireAuth, checkPermission(Module.Users, Action.View)]
    },
    controller.list
  );

  app.get(
    '/users/:id',
    { schema: { tags: ['Users'], params: IdParamSchema }, preHandler: [requireAuth] },
    controller.getById
  );

  app.patch(
    '/users/:id',
    {
      schema: { tags: ['Users'], params: IdParamSchema, body: UpdateUserRequestSchema },
      preHandler: [requireAuth]
    },
    controller.update
  );

  app.delete(
    '/users/:id',
    {
      schema: { tags: ['Users'], params: IdParamSchema },
      preHandler: [requireAuth, checkPermission(Module.Users, Action.Delete)]
    },
    controller.remove
  );

  app.patch(
    '/users/:id/password',
    {
      schema: { tags: ['Users'], params: IdParamSchema, body: UpdatePasswordRequestSchema },
      preHandler: [requireAuth]
    },
    controller.changePassword
  );

  app.patch(
    '/users/:id/approve',
    {
      schema: { tags: ['Users'], params: IdParamSchema },
      preHandler: [requireAuth, checkPermission(Module.Users, Action.Update)]
    },
    controller.approve
  );

  app.get(
    '/users/:id/permissions',
    {
      schema: { tags: ['Users'], params: IdParamSchema },
      preHandler: [requireAuth, checkPermission(Module.Users, Action.View)]
    },
    controller.getPermissions
  );

  app.put(
    '/users/:id/permissions',
    {
      schema: { tags: ['Users'], params: IdParamSchema, body: UpdatePermissionsRequestSchema },
      preHandler: [requireAuth, checkPermission(Module.Users, Action.Update)]
    },
    controller.setPermissions
  );
}
