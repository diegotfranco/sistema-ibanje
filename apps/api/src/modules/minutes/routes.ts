import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../../hooks/requireAuth.js';
import { checkPermission } from '../../hooks/checkPermission.js';
import { Module, Action } from '../../lib/constants.js';
import { IdParamSchema } from '../../lib/validation.js';
import { ErrorResponseSchema } from '../../lib/http-schemas.js';
import {
  ListMinutesRequestSchema,
  CreateMinuteRequestSchema,
  UpdateMinuteVersionRequestSchema,
  UpdateMinuteRequestSchema,
  EditApprovedMinuteRequestSchema,
  ApproveMinuteRequestSchema,
  MinuteResponseSchema,
  MinuteListResponseSchema,
  MinuteTemplateResponseSchema,
  CreateMinuteTemplateRequestSchema,
  UpdateMinuteTemplateRequestSchema,
  SetAttendersPresentSchema
} from './schema.js';
import * as controller from './controller.js';

export async function minutesRoutes(app: FastifyInstance) {
  app.get(
    '/minutes',
    {
      schema: {
        tags: ['Minutes'],
        querystring: ListMinutesRequestSchema,
        response: {
          200: MinuteListResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Minutes, Action.View)]
    },
    controller.list
  );

  app.get(
    '/minutes/suggested-number',
    {
      schema: {
        tags: ['Minutes'],
        response: {
          200: z.object({ value: z.string() }),
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Minutes, Action.Create)]
    },
    controller.suggestedMinuteNumber
  );

  app.get(
    '/minutes/:id',
    {
      schema: {
        tags: ['Minutes'],
        params: IdParamSchema,
        response: {
          200: MinuteResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.getById
  );

  app.post(
    '/minutes',
    {
      schema: {
        tags: ['Minutes'],
        body: CreateMinuteRequestSchema,
        response: {
          201: MinuteResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Minutes, Action.Create)]
    },
    controller.create
  );

  app.patch(
    '/minutes/:id/pending',
    {
      schema: {
        tags: ['Minutes'],
        params: IdParamSchema,
        body: UpdateMinuteVersionRequestSchema,
        response: {
          200: MinuteResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Minutes, Action.Update)]
    },
    controller.updatePending
  );

  app.post(
    '/minutes/:id/edit-approved',
    {
      schema: {
        tags: ['Minutes'],
        params: IdParamSchema,
        body: EditApprovedMinuteRequestSchema,
        response: {
          200: MinuteResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Minutes, Action.Update)]
    },
    controller.editApproved
  );

  app.post(
    '/minutes/:id/approve',
    {
      schema: {
        tags: ['Minutes'],
        params: IdParamSchema,
        body: ApproveMinuteRequestSchema,
        response: {
          200: MinuteResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Minutes, Action.Review)]
    },
    controller.approve
  );

  app.delete(
    '/minutes/:id',
    {
      schema: {
        tags: ['Minutes'],
        params: IdParamSchema,
        response: {
          204: { type: 'null', description: 'Deleted' },
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Minutes, Action.Delete)]
    },
    controller.remove
  );

  app.patch(
    '/minutes/:id',
    {
      schema: {
        tags: ['Minutes'],
        params: IdParamSchema,
        body: UpdateMinuteRequestSchema,
        response: {
          200: MinuteResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Minutes, Action.Update)]
    },
    controller.updateMinute
  );

  app.post(
    '/minutes/:id/finalize-draft',
    {
      schema: {
        tags: ['Minutes'],
        params: IdParamSchema,
        response: {
          200: MinuteResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Minutes, Action.Update)]
    },
    controller.finalizeDraft
  );

  app.post(
    '/minutes/:id/sign',
    {
      schema: {
        tags: ['Minutes'],
        params: IdParamSchema,
        response: {
          200: MinuteResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Minutes, Action.Update)]
    },
    controller.sign
  );

  const PdfResponseSchema = {
    type: 'string',
    format: 'binary',
    description: 'PDF document'
  } as const;

  app.get(
    '/minutes/:id/pdf',
    {
      schema: {
        tags: ['Minutes'],
        params: IdParamSchema,
        querystring: z.object({ download: z.string().optional() }),
        response: {
          200: PdfResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Minutes, Action.View)]
    },
    controller.pdf
  );

  app.get(
    '/minutes/meetings/:meetingId/attenders-present',
    {
      schema: {
        tags: ['Minutes'],
        params: z.object({ meetingId: z.coerce.number().int().positive() }),
        response: {
          200: z.object({
            data: z.array(z.object({ id: z.number().int().positive(), name: z.string() }))
          }),
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Minutes, Action.View)]
    },
    controller.getAttendersPresent
  );

  app.put(
    '/minutes/meetings/:meetingId/attenders-present',
    {
      schema: {
        tags: ['Minutes'],
        params: z.object({ meetingId: z.coerce.number().int().positive() }),
        body: SetAttendersPresentSchema,
        response: {
          204: { type: 'null', description: 'Updated' },
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.Minutes, Action.Update)]
    },
    controller.setAttendersPresent
  );

  app.get(
    '/minute-templates',
    {
      schema: {
        tags: ['Minute Templates'],
        response: {
          200: {
            type: 'array',
            items: MinuteTemplateResponseSchema
          },
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.MinuteTemplates, Action.View)]
    },
    controller.listMinuteTemplates
  );

  app.post(
    '/minute-templates',
    {
      schema: {
        tags: ['Minute Templates'],
        body: CreateMinuteTemplateRequestSchema,
        response: {
          201: MinuteTemplateResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.MinuteTemplates, Action.Create)]
    },
    controller.createMinuteTemplate
  );

  app.get(
    '/minute-templates/:id',
    {
      schema: {
        tags: ['Minute Templates'],
        params: IdParamSchema,
        response: {
          200: MinuteTemplateResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.MinuteTemplates, Action.View)]
    },
    controller.getMinuteTemplate
  );

  app.put(
    '/minute-templates/:id',
    {
      schema: {
        tags: ['Minute Templates'],
        params: IdParamSchema,
        body: UpdateMinuteTemplateRequestSchema,
        response: {
          200: MinuteTemplateResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.MinuteTemplates, Action.Update)]
    },
    controller.updateMinuteTemplate
  );

  app.delete(
    '/minute-templates/:id',
    {
      schema: {
        tags: ['Minute Templates'],
        params: IdParamSchema,
        response: {
          204: z.null(),
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.MinuteTemplates, Action.Delete)]
    },
    controller.deleteMinuteTemplate
  );
}
