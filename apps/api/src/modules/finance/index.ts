import { FastifyInstance } from 'fastify';
import { paymentMethodsRoutes } from './payment-methods/routes';
import { designatedFundsRoutes } from './designated-funds/routes';
import { incomeCategoriesRoutes } from './income/categories/routes';
import { incomeEntriesRoutes } from './income/entries/routes';
import { expenseCategoriesRoutes } from './expenses/categories/routes';
import { expenseEntriesRoutes } from './expenses/entries/routes';

export async function financeRoutes(app: FastifyInstance) {
  await app.register(paymentMethodsRoutes);
  await app.register(designatedFundsRoutes);
  await app.register(incomeCategoriesRoutes);
  await app.register(incomeEntriesRoutes);
  await app.register(expenseCategoriesRoutes);
  await app.register(expenseEntriesRoutes);
}
