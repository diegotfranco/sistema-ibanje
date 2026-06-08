import { eq, count, and } from 'drizzle-orm';
import type { CampaignStatusValue } from '@sistema-ibanje/shared';
import { db } from '../../../db/index.js';
import { campaigns } from '../../../db/schema.js';
import { notDeleted } from '../../../lib/softDelete.js';

const selectFields = {
  id: campaigns.id,
  name: campaigns.name,
  description: campaigns.description,
  targetAmount: campaigns.targetAmount,
  targetDate: campaigns.targetDate,
  status: campaigns.status,
  createdAt: campaigns.createdAt
};

export async function listCampaigns(offset: number, limit: number, status?: CampaignStatusValue) {
  const condition = status
    ? and(notDeleted(campaigns), eq(campaigns.status, status))
    : notDeleted(campaigns);

  const rows = await db
    .select(selectFields)
    .from(campaigns)
    .where(condition)
    .orderBy(campaigns.id)
    .offset(offset)
    .limit(limit);

  const countResult = await db.select({ count: count() }).from(campaigns).where(condition);
  return { rows, total: countResult[0]?.count ?? 0 };
}

export async function findCampaignById(id: number) {
  const result = await db
    .select(selectFields)
    .from(campaigns)
    .where(and(eq(campaigns.id, id), notDeleted(campaigns)))
    .limit(1);

  return result[0] ?? null;
}

export async function insertCampaign(data: {
  name: string;
  description?: string;
  targetAmount?: string;
  targetDate?: string | null;
}) {
  const result = await db.insert(campaigns).values(data).returning(selectFields);
  return result[0] ?? null;
}

export async function updateCampaign(
  id: number,
  data: Partial<
    Pick<typeof campaigns.$inferInsert, 'name' | 'description' | 'targetAmount' | 'targetDate'>
  >
) {
  const result = await db
    .update(campaigns)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(campaigns.id, id))
    .returning(selectFields);

  return result[0] ?? null;
}

// Campaign lifecycle flip (ativa ↔ encerrada). Orthogonal to soft-delete — only touches `status`.
export async function updateCampaignStatus(id: number, status: CampaignStatusValue) {
  const result = await db
    .update(campaigns)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(campaigns.id, id), notDeleted(campaigns)))
    .returning(selectFields);

  return result[0] ?? null;
}

export async function softDeleteCampaign(id: number) {
  await db
    .update(campaigns)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(campaigns.id, id), notDeleted(campaigns)));
}

// Restore clears `deletedAt`. It must target an already-deleted row, so it deliberately
// does NOT compose `notDeleted` — returning the row, or null when the id doesn't exist.
export async function restoreCampaign(id: number) {
  const result = await db
    .update(campaigns)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(eq(campaigns.id, id))
    .returning(selectFields);

  return result[0] ?? null;
}
