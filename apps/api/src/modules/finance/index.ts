import { FastifyInstance } from 'fastify';
import { paymentMethodsRoutes } from './payment-methods/routes.js';
import { designatedFundsRoutes } from './designated-funds/routes.js';
import { incomeCategoriesRoutes } from './income/categories/routes.js';
import { incomeEntriesRoutes } from './income/entries/routes.js';
import { expenseCategoriesRoutes } from './expenses/categories/routes.js';
import { expenseEntriesRoutes } from './expenses/entries/routes.js';
import { monthlyClosingsRoutes } from './monthly-closings/routes.js';
import { reportsRoutes } from './reports/routes.js';

export async function financeRoutes(app: FastifyInstance) {
  await app.register(paymentMethodsRoutes);
  await app.register(designatedFundsRoutes);
  await app.register(incomeCategoriesRoutes);
  await app.register(incomeEntriesRoutes);
  await app.register(expenseCategoriesRoutes);
  await app.register(expenseEntriesRoutes);
  await app.register(monthlyClosingsRoutes);
  await app.register(reportsRoutes);
}
