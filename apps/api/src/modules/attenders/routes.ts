import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../hooks/requireAuth.js';
import { checkPermission } from '../../hooks/checkPermission.js';
import { Module, Action } from '../../lib/constants.js';
import { IdParamSchema } from '../../lib/validation.js';
import { ErrorResponseSchema } from '../../lib/http-schemas.js';
import {
  ListAttendersRequestSchema,
  AttendersExportPdfQuerySchema,
  CreateAttenderRequestSchema,
  UpdateAttenderRequestSchema,
  AttenderResponseSchema,
  AttenderListResponseSchema,
  AttenderDonationsSummaryResponseSchema,
  AttenderDonationsEntriesResponseSchema,
  DonationsSummaryQuerySchema,
  DonationsEntriesQuerySchema,
  DonationsPdfQuerySchema
} from './schema.js';
import * as controller from './controller.js';

// Binary response schema so the serializer passes the PDF buffer through untouched.
// Without a 200 schema the zod type-provider JSON-stringifies the Buffer (it arrives as
// application/json), which is why downloads showed up as "pdf.json".
const PdfResponseSchema = {
  type: 'string',
  format: 'binary',
  description: 'PDF document'
} as const;

export async function attendersRoutes(app: FastifyInstance) {
  app.post(
    '/attenders',
    {
      schema: {
        tags: ['Attenders'],
        body: CreateAttenderRequestSchema,
        response: {
          201: AttenderResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Attenders, Action.Create)]
    },
    controller.create
  );

  app.get(
    '/attenders',
    {
      schema: {
        tags: ['Attenders'],
        querystring: ListAttendersRequestSchema,
        response: {
          200: AttenderListResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Attenders, Action.Report)]
    },
    controller.list
  );

  app.get(
    '/attenders/export/pdf',
    {
      schema: {
        tags: ['Attenders'],
        querystring: AttendersExportPdfQuerySchema,
        response: {
          200: PdfResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Attenders, Action.Report)]
    },
    controller.exportPdf
  );

  app.get(
    '/attenders/:id',
    {
      schema: {
        tags: ['Attenders'],
        params: IdParamSchema,
        response: {
          200: AttenderResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.getById
  );

  app.patch(
    '/attenders/:id',
    {
      schema: {
        tags: ['Attenders'],
        params: IdParamSchema,
        body: UpdateAttenderRequestSchema,
        response: {
          200: AttenderResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Attenders, Action.Update)]
    },
    controller.update
  );

  app.get(
    '/attenders/:id/donations/summary',
    {
      schema: {
        tags: ['Attenders'],
        params: IdParamSchema,
        querystring: DonationsSummaryQuerySchema,
        response: {
          200: AttenderDonationsSummaryResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.donationsSummary
  );

  app.get(
    '/attenders/:id/donations/entries',
    {
      schema: {
        tags: ['Attenders'],
        params: IdParamSchema,
        querystring: DonationsEntriesQuerySchema,
        response: {
          200: AttenderDonationsEntriesResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.donationsEntries
  );

  app.get(
    '/attenders/:id/donations/pdf',
    {
      schema: {
        tags: ['Attenders'],
        params: IdParamSchema,
        querystring: DonationsPdfQuerySchema,
        response: {
          200: PdfResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.donationsPdf
  );

  app.delete(
    '/attenders/:id',
    {
      schema: {
        tags: ['Attenders'],
        params: IdParamSchema,
        response: {
          204: { type: 'null', description: 'Deleted' },
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Attenders, Action.Delete)]
    },
    controller.remove
  );
}
