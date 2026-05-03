import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth/routes';
import { usersRoutes } from './users/routes';
import { membersRoutes } from './members/routes';
import { rolesRoutes } from './roles/routes';
import { financeRoutes } from './finance/index';

export async function registerRoutes(app: FastifyInstance) {
  await app.register(authRoutes);
  await app.register(usersRoutes);
  await app.register(membersRoutes);
  await app.register(rolesRoutes);
  await app.register(financeRoutes);
}
