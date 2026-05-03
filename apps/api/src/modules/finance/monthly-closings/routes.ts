import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../../hooks/requireAuth';
import { checkPermission } from '../../../hooks/checkPermission';
import { Module, Action } from '../../../lib/constants';
import { IdParamSchema } from '../../../lib/validation';
import {
  ListMonthlyClosingsRequestSchema,
  CreateMonthlyClosingRequestSchema,
  SubmitMonthlyClosingRequestSchema,
  ApproveMonthlyClosingRequestSchema,
  RejectMonthlyClosingRequestSchema
} from './schema';
import * as controller from './controller';

export async function monthlyClosingsRoutes(app: FastifyInstance) {
  app.get(
    '/monthly-closings',
    {
      schema: { tags: ['Monthly Closings'], querystring: ListMonthlyClosingsRequestSchema },
      preHandler: [requireAuth, checkPermission(Module.MonthlyClosings, Action.View)]
    },
    controller.list
  );

  app.get(
    '/monthly-closings/:id',
    {
      schema: { tags: ['Monthly Closings'], params: IdParamSchema },
      preHandler: [requireAuth]
    },
    controller.getById
  );

  app.post(
    '/monthly-closings',
    {
      schema: { tags: ['Monthly Closings'], body: CreateMonthlyClosingRequestSchema },
      preHandler: [requireAuth, checkPermission(Module.MonthlyClosings, Action.Create)]
    },
    controller.create
  );

  app.post(
    '/monthly-closings/:id/submit',
    {
      schema: {
        tags: ['Monthly Closings'],
        params: IdParamSchema,
        body: SubmitMonthlyClosingRequestSchema
      },
      preHandler: [requireAuth, checkPermission(Module.MonthlyClosings, Action.Create)]
    },
    controller.submit
  );

  app.post(
    '/monthly-closings/:id/approve',
    {
      schema: {
        tags: ['Monthly Closings'],
        params: IdParamSchema,
        body: ApproveMonthlyClosingRequestSchema
      },
      preHandler: [requireAuth, checkPermission(Module.MonthlyClosings, Action.Review)]
    },
    controller.approve
  );

  app.post(
    '/monthly-closings/:id/reject',
    {
      schema: {
        tags: ['Monthly Closings'],
        params: IdParamSchema,
        body: RejectMonthlyClosingRequestSchema
      },
      preHandler: [requireAuth, checkPermission(Module.MonthlyClosings, Action.Review)]
    },
    controller.reject
  );

  app.post(
    '/monthly-closings/:id/close',
    {
      schema: { tags: ['Monthly Closings'], params: IdParamSchema },
      preHandler: [requireAuth, checkPermission(Module.MonthlyClosings, Action.Update)]
    },
    controller.close
  );

  app.delete(
    '/monthly-closings/:id',
    {
      schema: { tags: ['Monthly Closings'], params: IdParamSchema },
      preHandler: [requireAuth, checkPermission(Module.MonthlyClosings, Action.Delete)]
    },
    controller.remove
  );
}
