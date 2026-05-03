import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../hooks/requireAuth';
import {
  LoginRequestSchema,
  RegisterRequestSchema,
  PasswordResetRequestSchema,
  ResetPasswordRequestSchema,
} from './schema';
import * as controller from './controller';

export async function authRoutes(app: FastifyInstance) {
  app.get('/auth/csrf-token', { schema: { tags: ['Auth'] } }, controller.getCsrfToken);

  app.post(
    '/auth/login',
    {
      schema: { tags: ['Auth'], body: LoginRequestSchema },
      preHandler: [app.csrfProtection],
      config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
    },
    controller.login
  );

  app.post('/auth/logout', { schema: { tags: ['Auth'] }, preHandler: [app.csrfProtection, requireAuth] }, controller.logout);

  app.get('/auth/me', { schema: { tags: ['Auth'] }, preHandler: [requireAuth] }, controller.me);

  app.post(
    '/auth/register',
    {
      schema: { tags: ['Auth'], body: RegisterRequestSchema },
      preHandler: [app.csrfProtection],
      config: { rateLimit: { max: 3, timeWindow: '1 hour' } },
    },
    controller.register
  );

  app.post(
    '/auth/password-reset/request',
    {
      schema: { tags: ['Auth'], body: PasswordResetRequestSchema },
      preHandler: [app.csrfProtection],
      config: { rateLimit: { max: 3, timeWindow: '1 hour' } },
    },
    controller.requestPasswordReset
  );

  app.post(
    '/auth/password-reset/confirm',
    {
      schema: { tags: ['Auth'], body: ResetPasswordRequestSchema },
      preHandler: [app.csrfProtection],
    },
    controller.confirmPasswordReset
  );
}
