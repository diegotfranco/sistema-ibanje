import Fastify from 'fastify'
import { env } from './config/env'

const app = Fastify({
  logger: {
    level: env.LOG_LEVEL,
    transport:
      env.NODE_ENV === 'development'
        ? { target: 'pino-pretty' }
        : undefined,
  },
})

const start = async () => {
  try {
    await app.listen({
      port: env.PORT,
      host: '0.0.0.0',
    })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()

export default app