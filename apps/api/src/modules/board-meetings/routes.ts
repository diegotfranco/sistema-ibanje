import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../hooks/requireAuth.js';
import { checkPermission } from '../../hooks/checkPermission.js';
import { Module, Action } from '../../lib/constants.js';
import { IdParamSchema } from '../../lib/validation.js';
import {
  ListBoardMeetingsRequestSchema,
  CreateBoardMeetingRequestSchema,
  UpdateBoardMeetingRequestSchema,
  SetAgendaRequestSchema
} from './schema.js';
import * as controller from './controller.js';

export async function boardMeetingsRoutes(app: FastifyInstance) {
  app.get(
    '/board-meetings',
    { schema: { tags: ['Board Meetings'], querystring: ListBoardMeetingsRequestSchema }, preHandler: [requireAuth, checkPermission(Module.Agendas, Action.View)] },
    controller.list
  );

  app.get(
    '/board-meetings/:id',
    { schema: { tags: ['Board Meetings'], params: IdParamSchema }, preHandler: [requireAuth] },
    controller.getById
  );

  app.post(
    '/board-meetings',
    { schema: { tags: ['Board Meetings'], body: CreateBoardMeetingRequestSchema }, preHandler: [requireAuth, checkPermission(Module.Agendas, Action.Create)] },
    controller.create
  );

  app.patch(
    '/board-meetings/:id',
    { schema: { tags: ['Board Meetings'], params: IdParamSchema, body: UpdateBoardMeetingRequestSchema }, preHandler: [requireAuth, checkPermission(Module.Agendas, Action.Update)] },
    controller.update
  );

  app.put(
    '/board-meetings/:id/agenda',
    { schema: { tags: ['Board Meetings'], params: IdParamSchema, body: SetAgendaRequestSchema }, preHandler: [requireAuth, checkPermission(Module.Agendas, Action.Update)] },
    controller.setAgenda
  );

  app.delete(
    '/board-meetings/:id',
    { schema: { tags: ['Board Meetings'], params: IdParamSchema }, preHandler: [requireAuth, checkPermission(Module.Agendas, Action.Delete)] },
    controller.remove
  );
}
