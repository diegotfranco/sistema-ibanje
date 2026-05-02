import { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { isHttpError } from '../lib/errors'

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ message: 'Validation error', errors: error.issues })
    }
    if (isHttpError(error) && error.statusCode < 500) {
      return reply.code(error.statusCode).send({ message: error.message })
    }
    app.log.error(error)
    return reply.code(500).send({ message: 'Internal server error' })
  })
}
