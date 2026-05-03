import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../hooks/requireAuth';
import { checkPermission } from '../../hooks/checkPermission';
import { Module, Action } from '../../lib/constants';
import { IdParamSchema } from '../../lib/validation';
import {
  ListRolesRequestSchema,
  CreateRoleRequestSchema,
  UpdateRoleRequestSchema,
  SetRolePermissionsRequestSchema,
} from './schema';
import * as controller from './controller';

export async function rolesRoutes(app: FastifyInstance) {
  app.get(
    '/roles',
    {
      schema: { tags: ['Roles'], querystring: ListRolesRequestSchema },
      preHandler: [requireAuth, checkPermission(Module.Roles, Action.View)],
    },
    controller.list
  );

  app.get(
    '/roles/:id',
    { schema: { tags: ['Roles'], params: IdParamSchema }, preHandler: [requireAuth] },
    controller.getById
  );

  app.post(
    '/roles',
    {
      schema: { tags: ['Roles'], body: CreateRoleRequestSchema },
      preHandler: [requireAuth, checkPermission(Module.Roles, Action.Create)],
    },
    controller.create
  );

  app.patch(
    '/roles/:id',
    {
      schema: { tags: ['Roles'], params: IdParamSchema, body: UpdateRoleRequestSchema },
      preHandler: [requireAuth, checkPermission(Module.Roles, Action.Update)],
    },
    controller.update
  );

  app.delete(
    '/roles/:id',
    {
      schema: { tags: ['Roles'], params: IdParamSchema },
      preHandler: [requireAuth, checkPermission(Module.Roles, Action.Delete)],
    },
    controller.remove
  );

  app.get(
    '/roles/:id/permissions',
    { schema: { tags: ['Roles'], params: IdParamSchema }, preHandler: [requireAuth] },
    controller.getPermissions
  );

  app.put(
    '/roles/:id/permissions',
    {
      schema: { tags: ['Roles'], params: IdParamSchema, body: SetRolePermissionsRequestSchema },
      preHandler: [requireAuth, checkPermission(Module.Roles, Action.Update)],
    },
    controller.setPermissions
  );

  app.get('/modules', { schema: { tags: ['Roles'] }, preHandler: [requireAuth] }, controller.getModules);
  app.get('/permission-types', { schema: { tags: ['Roles'] }, preHandler: [requireAuth] }, controller.getPermissionTypes);
}
