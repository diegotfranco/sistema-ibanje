import { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { isHttpError } from '../lib/errors.js';

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of error.issues) {
        const field = issue.path.join('.');
        fieldErrors[field] = issue.message;
      }
      return reply.code(400).send({ message: 'Validation error', fieldErrors });
    }
    if (isHttpError(error) && error.statusCode < 500) {
      const body: Record<string, unknown> = { message: error.message };
      if (error.fieldErrors) {
        body.fieldErrors = error.fieldErrors;
      }
      return reply.code(error.statusCode).send(body);
    }
    app.log.error(error);
    return reply.code(500).send({ message: 'Internal server error' });
  });
}
