import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../hooks/requireAuth';
import { checkPermission } from '../../hooks/checkPermission';
import { Module, Action } from '../../lib/constants';
import { IdParamSchema } from '../../lib/validation';
import {
  ListMembersRequestSchema,
  CreateMemberRequestSchema,
  UpdateMemberRequestSchema,
} from './schema';
import * as controller from './controller';

export async function membersRoutes(app: FastifyInstance) {
  app.post(
    '/members',
    {
      schema: { tags: ['Members'], body: CreateMemberRequestSchema },
      preHandler: [requireAuth, checkPermission(Module.Members, Action.Create)],
    },
    controller.create
  );

  app.get(
    '/members',
    {
      schema: { tags: ['Members'], querystring: ListMembersRequestSchema },
      preHandler: [requireAuth, checkPermission(Module.Members, Action.View)],
    },
    controller.list
  );

  app.get(
    '/members/:id',
    { schema: { tags: ['Members'], params: IdParamSchema }, preHandler: [requireAuth] },
    controller.getById
  );

  app.patch(
    '/members/:id',
    {
      schema: { tags: ['Members'], params: IdParamSchema, body: UpdateMemberRequestSchema },
      preHandler: [requireAuth, checkPermission(Module.Members, Action.Update)],
    },
    controller.update
  );

  app.delete(
    '/members/:id',
    {
      schema: { tags: ['Members'], params: IdParamSchema },
      preHandler: [requireAuth, checkPermission(Module.Members, Action.Delete)],
    },
    controller.remove
  );
}
