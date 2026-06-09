import { eq, count, and } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { paymentMethods } from '../../../db/schema.js';
import { notDeleted, deletedClause, type DeletedFilter } from '../../../lib/softDelete.js';

const selectFields = {
  id: paymentMethods.id,
  name: paymentMethods.name,
  allowsInflow: paymentMethods.allowsInflow,
  allowsOutflow: paymentMethods.allowsOutflow,
  status: paymentMethods.status,
  createdAt: paymentMethods.createdAt
};

export async function listPaymentMethods(offset: number, limit: number, deleted?: DeletedFilter) {
  const condition = deletedClause(paymentMethods, deleted);

  const rows = await db
    .select(selectFields)
    .from(paymentMethods)
    .where(condition)
    .orderBy(paymentMethods.id)
    .offset(offset)
    .limit(limit);

  const countResult = await db.select({ count: count() }).from(paymentMethods).where(condition);
  return { rows, total: countResult[0]?.count ?? 0 };
}

export async function findPaymentMethodById(id: number) {
  const result = await db
    .select(selectFields)
    .from(paymentMethods)
    .where(and(eq(paymentMethods.id, id), notDeleted(paymentMethods)))
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

export async function softDeletePaymentMethod(id: number) {
  await db
    .update(paymentMethods)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(paymentMethods.id, id), notDeleted(paymentMethods)));
}

export async function restorePaymentMethod(id: number) {
  const result = await db
    .update(paymentMethods)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(eq(paymentMethods.id, id))
    .returning(selectFields);

  return result[0] ?? null;
}
