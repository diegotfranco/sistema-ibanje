import { eq, count, and } from 'drizzle-orm';
import type { FundStatusValue } from '@sistema-ibanje/shared';
import { db } from '../../../db/index.js';
import { designatedFunds } from '../../../db/schema.js';
import { notDeleted } from '../../../lib/softDelete.js';

const selectFields = {
  id: designatedFunds.id,
  name: designatedFunds.name,
  description: designatedFunds.description,
  targetAmount: designatedFunds.targetAmount,
  targetDate: designatedFunds.targetDate,
  status: designatedFunds.status,
  createdAt: designatedFunds.createdAt
};

export async function listDesignatedFunds(offset: number, limit: number, status?: FundStatusValue) {
  const condition = status
    ? and(notDeleted(designatedFunds), eq(designatedFunds.status, status))
    : notDeleted(designatedFunds);

  const rows = await db
    .select(selectFields)
    .from(designatedFunds)
    .where(condition)
    .orderBy(designatedFunds.id)
    .offset(offset)
    .limit(limit);

  const countResult = await db.select({ count: count() }).from(designatedFunds).where(condition);
  return { rows, total: countResult[0]?.count ?? 0 };
}

export async function findDesignatedFundById(id: number) {
  const result = await db
    .select(selectFields)
    .from(designatedFunds)
    .where(and(eq(designatedFunds.id, id), notDeleted(designatedFunds)))
    .limit(1);

  return result[0] ?? null;
}

export async function insertDesignatedFund(data: {
  name: string;
  description?: string;
  targetAmount?: string;
  targetDate?: string | null;
}) {
  const result = await db.insert(designatedFunds).values(data).returning(selectFields);
  return result[0] ?? null;
}

export async function updateDesignatedFund(
  id: number,
  data: Partial<
    Pick<
      typeof designatedFunds.$inferInsert,
      'name' | 'description' | 'targetAmount' | 'targetDate'
    >
  >
) {
  const result = await db
    .update(designatedFunds)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(designatedFunds.id, id))
    .returning(selectFields);

  return result[0] ?? null;
}

// Campaign lifecycle flip (ativa ↔ encerrada). Orthogonal to soft-delete — only touches `status`.
export async function updateDesignatedFundStatus(id: number, status: FundStatusValue) {
  const result = await db
    .update(designatedFunds)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(designatedFunds.id, id), notDeleted(designatedFunds)))
    .returning(selectFields);

  return result[0] ?? null;
}

export async function softDeleteDesignatedFund(id: number) {
  await db
    .update(designatedFunds)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(designatedFunds.id, id), notDeleted(designatedFunds)));
}

// Restore clears `deletedAt`. It must target an already-deleted row, so it deliberately
// does NOT compose `notDeleted` — returning the row, or null when the id doesn't exist.
export async function restoreDesignatedFund(id: number) {
  const result = await db
    .update(designatedFunds)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(eq(designatedFunds.id, id))
    .returning(selectFields);

  return result[0] ?? null;
}
