import { eq, count } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { paymentMethods } from '../../../db/schema.js';

const selectFields = {
  id: paymentMethods.id,
  name: paymentMethods.name,
  allowsInflow: paymentMethods.allowsInflow,
  allowsOutflow: paymentMethods.allowsOutflow,
  status: paymentMethods.status,
  createdAt: paymentMethods.createdAt
};

export async function listPaymentMethods(offset: number, limit: number) {
  const rows = await db
    .select(selectFields)
    .from(paymentMethods)
    .orderBy(paymentMethods.id)
    .offset(offset)
    .limit(limit);

  const countResult = await db.select({ count: count() }).from(paymentMethods);
  return { rows, total: countResult[0]?.count ?? 0 };
}

export async function findPaymentMethodById(id: number) {
  const result = await db
    .select(selectFields)
    .from(paymentMethods)
    .where(eq(paymentMethods.id, id))
    .limit(1);

  return result[0] ?? null;
}

export async function insertPaymentMethod(data: {
  name: string;
  allowsInflow: boolean;
  allowsOutflow: boolean;
}) {
  const result = await db.insert(paymentMethods).values(data).returning(selectFields);
  return result[0] ?? null;
}

export async function updatePaymentMethod(
  id: number,
  data: Partial<Pick<typeof paymentMethods.$inferInsert, 'name' | 'allowsInflow' | 'allowsOutflow'>>
) {
  const result = await db
    .update(paymentMethods)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(paymentMethods.id, id))
    .returning(selectFields);

  return result[0] ?? null;
}

export async function deactivatePaymentMethod(id: number) {
  await db
    .update(paymentMethods)
    .set({ status: 'inativo', updatedAt: new Date() })
    .where(eq(paymentMethods.id, id));
}
