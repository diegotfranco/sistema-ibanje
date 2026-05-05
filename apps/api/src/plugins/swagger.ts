import { FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import scalarFastify from '@scalar/fastify-api-reference';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';

export async function registerSwaggerPlugin(app: FastifyInstance) {
  await app.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Sistema Ibanje API',
        description: 'Church management system REST API',
        version: '1.0.0'
      }
    },
    transform: jsonSchemaTransform
  });

  await app.register(scalarFastify, {
    routePrefix: '/docs',
    logLevel: 'silent'
  });
}
