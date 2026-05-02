import { FastifyInstance } from 'fastify';
import { paymentMethodsRoutes } from './payment-methods/routes.js';
import { designatedFundsRoutes } from './designated-funds/routes.js';
import { incomeCategoriesRoutes } from './income-categories/routes.js';
import { expenseCategoriesRoutes } from './expense-categories/routes.js';

export async function financeRoutes(app: FastifyInstance) {
  await app.register(paymentMethodsRoutes);
  await app.register(designatedFundsRoutes);
  await app.register(incomeCategoriesRoutes);
  await app.register(expenseCategoriesRoutes);
}
