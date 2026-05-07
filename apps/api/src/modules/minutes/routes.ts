import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../hooks/requireAuth.js';
import { checkPermission } from '../../hooks/checkPermission.js';
import { Module, Action } from '../../lib/constants.js';
import { IdParamSchema } from '../../lib/validation.js';
import {
  ListMinutesRequestSchema,
  CreateMinuteRequestSchema,
  UpdateMinuteVersionRequestSchema,
  EditApprovedMinuteRequestSchema,
  ApproveMinuteRequestSchema
} from './schema.js';
import * as controller from './controller.js';

export async function minutesRoutes(app: FastifyInstance) {
  app.get(
    '/minutes',
    {
      schema: { tags: ['Minutes'], querystring: ListMinutesRequestSchema },
      preHandler: [requireAuth, checkPermission(Module.Minutes, Action.View)]
    },
    controller.list
  );

  app.get(
    '/minutes/:id',
    { schema: { tags: ['Minutes'], params: IdParamSchema }, preHandler: [requireAuth] },
    controller.getById
  );

  app.post(
    '/minutes',
    {
      schema: { tags: ['Minutes'], body: CreateMinuteRequestSchema },
      preHandler: [requireAuth, checkPermission(Module.Minutes, Action.Create)]
    },
    controller.create
  );

  app.patch(
    '/minutes/:id/pending',
    {
      schema: { tags: ['Minutes'], params: IdParamSchema, body: UpdateMinuteVersionRequestSchema },
      preHandler: [requireAuth, checkPermission(Module.Minutes, Action.Update)]
    },
    controller.updatePending
  );

  app.post(
    '/minutes/:id/edit-approved',
    {
      schema: { tags: ['Minutes'], params: IdParamSchema, body: EditApprovedMinuteRequestSchema },
      preHandler: [requireAuth, checkPermission(Module.Minutes, Action.Update)]
    },
    controller.editApproved
  );

  app.post(
    '/minutes/:id/approve',
    {
      schema: { tags: ['Minutes'], params: IdParamSchema, body: ApproveMinuteRequestSchema },
      preHandler: [requireAuth, checkPermission(Module.Minutes, Action.Review)]
    },
    controller.approve
  );

  app.delete(
    '/minutes/:id',
    {
      schema: { tags: ['Minutes'], params: IdParamSchema },
      preHandler: [requireAuth, checkPermission(Module.Minutes, Action.Delete)]
    },
    controller.remove
  );
}
