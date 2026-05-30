import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../hooks/requireAuth.js';
import { checkPermission } from '../../hooks/checkPermission.js';
import { Module, Action } from '../../lib/constants.js';
import { IdParamSchema } from '../../lib/validation.js';
import { ErrorResponseSchema } from '../../lib/http-schemas.js';
import {
  ListCalendarEntriesRequestSchema,
  CreateCalendarEntryRequestSchema,
  UpdateCalendarEntryRequestSchema,
  CalendarEntryResponseSchema,
  CalendarEntryListResponseSchema,
  CalendarFeedQuerySchema,
  CalendarFeedResponseSchema
} from './schema.js';
import * as controller from './controller.js';

export async function calendarRoutes(app: FastifyInstance) {
  // Auth-only merged feed — every authenticated role sees reminders. Declared before /calendar/:id
  // so the static segment is matched first.
  app.get(
    '/calendar/feed',
    {
      schema: {
        tags: ['Calendar'],
        querystring: CalendarFeedQuerySchema,
        response: {
          200: CalendarFeedResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.feed
  );

  app.get(
    '/calendar',
    {
      schema: {
        tags: ['Calendar'],
        querystring: ListCalendarEntriesRequestSchema,
        response: {
          200: CalendarEntryListResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.SecretaryCalendar, Action.View)]
    },
    controller.list
  );

  app.get(
    '/calendar/:id',
    {
      schema: {
        tags: ['Calendar'],
        params: IdParamSchema,
        response: {
          200: CalendarEntryResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.SecretaryCalendar, Action.View)]
    },
    controller.getById
  );

  app.post(
    '/calendar',
    {
      schema: {
        tags: ['Calendar'],
        body: CreateCalendarEntryRequestSchema,
        response: {
          201: CalendarEntryResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.SecretaryCalendar, Action.Create)]
    },
    controller.create
  );

  app.patch(
    '/calendar/:id',
    {
      schema: {
        tags: ['Calendar'],
        params: IdParamSchema,
        body: UpdateCalendarEntryRequestSchema,
        response: {
          200: CalendarEntryResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.SecretaryCalendar, Action.Update)]
    },
    controller.update
  );

  app.delete(
    '/calendar/:id',
    {
      schema: {
        tags: ['Calendar'],
        params: IdParamSchema,
        response: {
          204: { type: 'null', description: 'Deleted' },
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.SecretaryCalendar, Action.Delete)]
    },
    controller.remove
  );
}
