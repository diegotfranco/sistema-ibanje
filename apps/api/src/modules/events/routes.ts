import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../hooks/requireAuth.js';
import { checkPermission } from '../../hooks/checkPermission.js';
import { Module, Action } from '../../lib/constants.js';
import { IdParamSchema } from '../../lib/validation.js';
import { ErrorResponseSchema } from '../../lib/http-schemas.js';
import {
  ListEventsRequestSchema,
  CreateEventRequestSchema,
  UpdateEventRequestSchema,
  EventResponseSchema,
  EventListResponseSchema
} from './schema.js';
import * as controller from './controller.js';

export async function eventsRoutes(app: FastifyInstance) {
  app.get(
    '/events',
    {
      schema: {
        tags: ['Events'],
        querystring: ListEventsRequestSchema,
        response: {
          200: EventListResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Events, Action.View)]
    },
    controller.list
  );

  app.get(
    '/events/:id',
    {
      schema: {
        tags: ['Events'],
        params: IdParamSchema,
        response: {
          200: EventResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Events, Action.View)]
    },
    controller.getById
  );

  app.post(
    '/events',
    {
      schema: {
        tags: ['Events'],
        body: CreateEventRequestSchema,
        response: {
          201: EventResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Events, Action.Create)]
    },
    controller.create
  );

  app.patch(
    '/events/:id',
    {
      schema: {
        tags: ['Events'],
        params: IdParamSchema,
        body: UpdateEventRequestSchema,
        response: {
          200: EventResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Events, Action.Update)]
    },
    controller.update
  );

  app.delete(
    '/events/:id',
    {
      schema: {
        tags: ['Events'],
        params: IdParamSchema,
        response: {
          204: { type: 'null', description: 'Deleted' },
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Events, Action.Delete)]
    },
    controller.remove
  );
}
