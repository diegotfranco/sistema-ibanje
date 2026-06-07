import { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import { isHttpError } from '../lib/errors.js';

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, _req, reply) => {
    // Transport-level validation (request body/query/params) handled by fastify-type-provider-zod.
    // Its failure is a FastifyError carrying `.validation` (NOT a ZodError instance), so map each
    // issue's instancePath ("/amount", "/nested/field") to a dotted fieldErrors key so the frontend's
    // applyFieldErrors() can place messages under the right field.
    if (hasZodFastifySchemaValidationErrors(error)) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of error.validation) {
        const field = issue.instancePath.replace(/^\//, '').replace(/\//g, '.');
        if (field) fieldErrors[field] = issue.message ?? 'Valor inválido';
      }
      return reply.code(400).send({ message: 'Validation error', fieldErrors });
    }
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
