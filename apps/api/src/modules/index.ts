import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth/routes.js';
import { usersRoutes } from './users/routes.js';
import { attendersRoutes } from './attenders/routes.js';
import { churchSettingsRoutes } from './church-settings/routes.js';
import { rolesRoutes } from './roles/routes.js';
import { financeRoutes } from './finance/index.js';
import { boardMeetingsRoutes } from './board-meetings/routes.js';
import { minutesRoutes } from './minutes/routes.js';
import { healthRoutes } from './health/routes.js';
import { membershipLettersRoutes } from './membership-letters/routes.js';

export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(usersRoutes);
  await app.register(attendersRoutes);
  await app.register(membershipLettersRoutes);
  await app.register(churchSettingsRoutes);
  await app.register(rolesRoutes);
  await app.register(financeRoutes);
  await app.register(boardMeetingsRoutes);
  await app.register(minutesRoutes);
}
