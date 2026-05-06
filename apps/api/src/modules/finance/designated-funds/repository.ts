import { eq, count } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { designatedFunds } from '../../../db/schema.js';

const selectFields = {
  id: designatedFunds.id,
  name: designatedFunds.name,
  description: designatedFunds.description,
  targetAmount: designatedFunds.targetAmount,
  status: designatedFunds.status,
  createdAt: designatedFunds.createdAt
};

export async function listDesignatedFunds(offset: number, limit: number) {
  const rows = await db
    .select(selectFields)
    .from(designatedFunds)
    .orderBy(designatedFunds.id)
    .offset(offset)
    .limit(limit);

  const countResult = await db.select({ count: count() }).from(designatedFunds);
  return { rows, total: countResult[0]?.count ?? 0 };
}

export async function findDesignatedFundById(id: number) {
  const result = await db
    .select(selectFields)
    .from(designatedFunds)
    .where(eq(designatedFunds.id, id))
    .limit(1);

  return result[0] ?? null;
}

export async function insertDesignatedFund(data: {
  name: string;
  description?: string;
  targetAmount?: string;
}) {
  const result = await db.insert(designatedFunds).values(data).returning(selectFields);
  return result[0] ?? null;
}

export async function updateDesignatedFund(
  id: number,
  data: Partial<Pick<typeof designatedFunds.$inferInsert, 'name' | 'description' | 'targetAmount'>>
) {
  const result = await db
    .update(designatedFunds)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(designatedFunds.id, id))
    .returning(selectFields);

  return result[0] ?? null;
}

export async function deactivateDesignatedFund(id: number) {
  await db
    .update(designatedFunds)
    .set({ status: 'inativo', updatedAt: new Date() })
    .where(eq(designatedFunds.id, id));
}
