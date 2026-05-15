import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../hooks/requireAuth.js';
import { ErrorResponseSchema } from '../../lib/http-schemas.js';
import {
  LoginRequestSchema,
  RegisterRequestSchema,
  PasswordResetRequestSchema,
  ResetPasswordRequestSchema,
  CsrfTokenResponseSchema,
  LoginResponseSchema,
  MessageResponseSchema,
  MeResponseSchema,
  UpdateMyProfileRequestSchema
} from './schema.js';
import { ListAttendersRequestSchema, AttenderResponseSchema } from '../attenders/schema.js';
import { IncomeEntryListResponseSchema } from '../finance/income/entries/schema.js';
import * as controller from './controller.js';

export async function authRoutes(app: FastifyInstance) {
  app.get(
    '/auth/csrf-token',
    {
      schema: {
        tags: ['Auth'],
        response: { 200: CsrfTokenResponseSchema }
      }
    },
    controller.getCsrfToken
  );

  app.post(
    '/auth/login',
    {
      schema: {
        tags: ['Auth'],
        body: LoginRequestSchema,
        response: {
          200: LoginResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          429: ErrorResponseSchema
        }
      },
      preHandler: [app.csrfProtection],
      config: { rateLimit: { max: 5, timeWindow: '15 minutes' } }
    },
    controller.login
  );

  app.post(
    '/auth/logout',
    {
      schema: {
        tags: ['Auth'],
        response: {
          200: MessageResponseSchema,
          401: ErrorResponseSchema
        }
      },
      preHandler: [app.csrfProtection, requireAuth]
    },
    controller.logout
  );

  app.get(
    '/auth/me',
    {
      schema: {
        tags: ['Auth'],
        response: {
          200: MeResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.me
  );

  app.post(
    '/auth/register',
    {
      schema: {
        tags: ['Auth'],
        body: RegisterRequestSchema,
        response: {
          201: MessageResponseSchema,
          400: ErrorResponseSchema,
          409: ErrorResponseSchema,
          429: ErrorResponseSchema
        }
      },
      preHandler: [app.csrfProtection],
      config: { rateLimit: { max: 3, timeWindow: '1 hour' } }
    },
    controller.register
  );

  app.post(
    '/auth/password-reset/request',
    {
      schema: {
        tags: ['Auth'],
        body: PasswordResetRequestSchema,
        response: {
          200: MessageResponseSchema,
          400: ErrorResponseSchema,
          429: ErrorResponseSchema
        }
      },
      preHandler: [app.csrfProtection],
      config: { rateLimit: { max: 3, timeWindow: '1 hour' } }
    },
    controller.requestPasswordReset
  );

  app.get(
    '/me/donations',
    {
      schema: {
        tags: ['Me'],
        querystring: ListAttendersRequestSchema,
        response: {
          200: IncomeEntryListResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [requireAuth]
    },
    controller.listMyDonations
  );

  app.patch(
    '/me/profile',
    {
      schema: {
        tags: ['Me'],
        body: UpdateMyProfileRequestSchema,
        response: {
          200: AttenderResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema
        }
      },
      preHandler: [app.csrfProtection, requireAuth]
    },
    controller.updateMyProfile
  );

  app.post(
    '/auth/password-reset/confirm',
    {
      schema: {
        tags: ['Auth'],
        body: ResetPasswordRequestSchema,
        response: {
          200: MessageResponseSchema,
          400: ErrorResponseSchema
        }
      },
      preHandler: [app.csrfProtection]
    },
    controller.confirmPasswordReset
  );
}
