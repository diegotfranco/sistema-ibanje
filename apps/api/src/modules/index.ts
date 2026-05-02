import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth/routes.js';
import { usersRoutes } from './users/routes.js';
import { membersRoutes } from './members/routes.js';
import { rolesRoutes } from './roles/routes.js';
import { financeRoutes } from './finance/index.js';

export async function registerRoutes(app: FastifyInstance) {
  await app.register(authRoutes);
  await app.register(usersRoutes);
  await app.register(membersRoutes);
  await app.register(rolesRoutes);
  await app.register(financeRoutes);
}
