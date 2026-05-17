import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../hooks/requireAuth.js';
import { checkPermission } from '../../hooks/checkPermission.js';
import { Module, Action } from '../../lib/constants.js';
import { IdParamSchema } from '../../lib/validation.js';
import { ErrorResponseSchema } from '../../lib/http-schemas.js';
import {
  ListMeetingsRequestSchema,
  CreateMeetingRequestSchema,
  UpdateMeetingRequestSchema,
  SetAgendaItemsRequestSchema,
  MeetingResponseSchema,
  MeetingListResponseSchema
} from './schema.js';
import * as controller from './controller.js';

export async function meetingsRoutes(app: FastifyInstance) {
  app.get(
    '/meetings',
    {
      schema: {
        tags: ['Meetings'],
        querystring: ListMeetingsRequestSchema,
        response: {
          200: MeetingListResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Agendas, Action.View)]
    },
    controller.list
  );

  app.get(
    '/meetings/:id',
    {
      schema: {
        tags: ['Meetings'],
        params: IdParamSchema,
        response: {
          200: MeetingResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.getById
  );

  app.post(
    '/meetings',
    {
      schema: {
        tags: ['Meetings'],
        body: CreateMeetingRequestSchema,
        response: {
          201: MeetingResponseSchema,
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
    '/meetings/:id',
    {
      schema: {
        tags: ['Meetings'],
        params: IdParamSchema,
        body: UpdateMeetingRequestSchema,
        response: {
          200: MeetingResponseSchema,
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
    '/meetings/:id/agenda-items',
    {
      schema: {
        tags: ['Meetings'],
        params: IdParamSchema,
        body: SetAgendaItemsRequestSchema,
        response: {
          200: MeetingResponseSchema,
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
    '/meetings/:id',
    {
      schema: {
        tags: ['Meetings'],
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
