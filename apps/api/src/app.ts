import Fastify from 'fastify'
import { env } from './config/env'
import { sql } from './db'

export function buildApp() {
  return Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === 'development'
          ? { target: 'pino-pretty' }
          : undefined,
    },
  })
}

async function start() {
  const app = buildApp()

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, 'shutdown signal received')
    try {
      await app.close()
      await sql.end()
    } finally {
      process.exit(0)
    }
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'))
  process.on('SIGINT', () => void shutdown('SIGINT'))

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
