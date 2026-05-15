import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../hooks/requireAuth.js';
import { checkPermission } from '../../hooks/checkPermission.js';
import { Module, Action } from '../../lib/constants.js';
import { IdParamSchema } from '../../lib/validation.js';
import { ErrorResponseSchema } from '../../lib/http-schemas.js';
import {
  ListBoardMeetingsRequestSchema,
  CreateBoardMeetingRequestSchema,
  UpdateBoardMeetingRequestSchema,
  SetAgendaItemsRequestSchema,
  BoardMeetingResponseSchema,
  BoardMeetingListResponseSchema
} from './schema.js';
import * as controller from './controller.js';

export async function boardMeetingsRoutes(app: FastifyInstance) {
  app.get(
    '/board-meetings',
    {
      schema: {
        tags: ['Board Meetings'],
        querystring: ListBoardMeetingsRequestSchema,
        response: {
          200: BoardMeetingListResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Agendas, Action.View)]
    },
    controller.list
  );

  app.get(
    '/board-meetings/:id',
    {
      schema: {
        tags: ['Board Meetings'],
        params: IdParamSchema,
        response: {
          200: BoardMeetingResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.getById
  );

  app.post(
    '/board-meetings',
    {
      schema: {
        tags: ['Board Meetings'],
        body: CreateBoardMeetingRequestSchema,
        response: {
          201: BoardMeetingResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Agendas, Action.Create)]
    },
    controller.create
  );

  app.patch(
    '/board-meetings/:id',
    {
      schema: {
        tags: ['Board Meetings'],
        params: IdParamSchema,
        body: UpdateBoardMeetingRequestSchema,
        response: {
          200: BoardMeetingResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Agendas, Action.Update)]
    },
    controller.update
  );

  app.put(
    '/board-meetings/:id/agenda-items',
    {
      schema: {
        tags: ['Board Meetings'],
        params: IdParamSchema,
        body: SetAgendaItemsRequestSchema,
        response: {
          200: BoardMeetingResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Agendas, Action.Update)]
    },
    controller.setAgendaItems
  );

  app.delete(
    '/board-meetings/:id',
    {
      schema: {
        tags: ['Board Meetings'],
        params: IdParamSchema,
        response: {
          204: { type: 'null', description: 'Deleted' },
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Agendas, Action.Delete)]
    },
    controller.remove
  );
}
