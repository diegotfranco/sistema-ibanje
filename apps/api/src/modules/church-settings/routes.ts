import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../hooks/requireAuth.js';
import { checkPermission } from '../../hooks/checkPermission.js';
import { Module, Action } from '../../lib/constants.js';
import { ErrorResponseSchema } from '../../lib/http-schemas.js';
import { UpdateChurchSettingsRequestSchema, ChurchSettingsResponseSchema } from './schema.js';
import * as controller from './controller.js';

export async function churchSettingsRoutes(app: FastifyInstance) {
  app.get(
    '/church-settings',
    {
      schema: {
        tags: ['Church Settings'],
        response: {
          200: ChurchSettingsResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.getSettings
  );

  app.put(
    '/church-settings',
    {
      schema: {
        tags: ['Church Settings'],
        body: UpdateChurchSettingsRequestSchema,
        response: {
          200: ChurchSettingsResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.ChurchSettings, Action.Update)]
    },
    controller.update
  );

  // Logo sub-resource — streams the stored image back so MinIO stays internal-only
  const LogoResponseSchema = {
    type: 'string',
    format: 'binary',
    description: 'Logo image (PNG or JPEG)'
  } as const;

  app.get(
    '/church-settings/logo',
    {
      schema: {
        tags: ['Church Settings'],
        response: {
          200: LogoResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.getLogo
  );

  // Accepts multipart/form-data with a single 'file' field (PNG or JPEG)
  app.post(
    '/church-settings/logo',
    {
      schema: {
        tags: ['Church Settings'],
        response: {
          200: ChurchSettingsResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.ChurchSettings, Action.Update)]
    },
    controller.uploadLogo
  );

  app.delete(
    '/church-settings/logo',
    {
      schema: {
        tags: ['Church Settings'],
        response: {
          204: { type: 'null', description: 'Logo removed' },
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth, checkPermission(Module.ChurchSettings, Action.Update)]
    },
    controller.deleteLogo
  );
}
