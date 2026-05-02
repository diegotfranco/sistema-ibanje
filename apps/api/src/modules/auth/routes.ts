import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../hooks/requireAuth';
import * as controller from './controller';

export async function authRoutes(app: FastifyInstance) {
  app.get('/auth/csrf-token', async (_req, reply) => {
    const token = reply.generateCsrf();
    return reply.send({ csrfToken: token });
  });

  app.post(
    '/auth/login',
    {
      preHandler: [app.csrfProtection],
      config: { rateLimit: { max: 5, timeWindow: '15 minutes' } }
    },
    controller.login
  );

  app.post('/auth/logout', { preHandler: [app.csrfProtection, requireAuth] }, controller.logout);

  app.get('/auth/me', { preHandler: [requireAuth] }, controller.me);

  app.post(
    '/auth/register',
    {
      preHandler: [app.csrfProtection],
      config: { rateLimit: { max: 3, timeWindow: '1 hour' } }
    },
    controller.register
  );

  app.post(
    '/auth/password-reset/request',
    {
      preHandler: [app.csrfProtection],
      config: { rateLimit: { max: 3, timeWindow: '1 hour' } }
    },
    controller.requestPasswordReset
  );

  app.post(
    '/auth/password-reset/confirm',
    {
      preHandler: [app.csrfProtection]
    },
    controller.confirmPasswordReset
  );
}
