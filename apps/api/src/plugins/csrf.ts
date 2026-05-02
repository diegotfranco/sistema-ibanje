import { FastifyInstance } from 'fastify'
import fastifyCsrf from '@fastify/csrf-protection'

export async function registerCsrfPlugin(app: FastifyInstance) {
  await app.register(fastifyCsrf, { sessionPlugin: '@fastify/session' })
}
