import { eq, count, sql, and, type SQL } from 'drizzle-orm';
import { db } from '../../../../db/index.js';
import { incomeCategories } from '../../../../db/schema.js';
import { notDeleted, deletedClause, type DeletedFilter } from '../../../../lib/softDelete.js';

const selectFields = {
  id: incomeCategories.id,
  parentId: incomeCategories.parentId,
  name: incomeCategories.name,
  description: incomeCategories.description,
  requiresMember: incomeCategories.requiresMember,
  status: incomeCategories.status,
  createdAt: incomeCategories.createdAt
};

// See expenses/categories/repository.ts for rationale — diacritic+case-insensitive
// match against own/parent/child name via a single correlated EXISTS. Requires
// the `unaccent` extension (migration 0003).
function incomeCategoryNameFilter(q: string): SQL {
  const pattern = `%${q}%`;
  return sql`EXISTS (
    SELECT 1 FROM ${incomeCategories} AS m
    WHERE unaccent(lower(m.name)) LIKE unaccent(lower(${pattern}))
      AND (
        m.id = ${incomeCategories.id}
        OR m.id = ${incomeCategories.parentId}
        OR m.parent_id = ${incomeCategories.id}
      )
  )`;
}

export async function listIncomeCategories(
  offset: number,
  limit: number,
  q?: string,
  deleted?: DeletedFilter
) {
  const deletedCondition = deletedClause(incomeCategories, deleted);
  const where = q ? and(deletedCondition, incomeCategoryNameFilter(q)) : deletedCondition;

  const rows = await db
    .select(selectFields)
    .from(incomeCategories)
    .where(where)
    .orderBy(incomeCategories.id)
    .offset(offset)
    .limit(limit);

  const countResult = await db.select({ count: count() }).from(incomeCategories).where(where);

  return { rows, total: countResult[0]?.count ?? 0 };
}

export async function findIncomeCategoryById(id: number) {
  const result = await db
    .select(selectFields)
    .from(incomeCategories)
    .where(and(eq(incomeCategories.id, id), notDeleted(incomeCategories)))
    .limit(1);

  return result[0] ?? null;
}

export async function insertIncomeCategory(data: {
  name: string;
  description?: string;
  parentId?: number;
  requiresMember: boolean;
}) {
  const result = await db.insert(incomeCategories).values(data).returning(selectFields);
  return result[0] ?? null;
}

export async function updateIncomeCategory(
  id: number,
  data: Partial<
    Pick<
      typeof incomeCategories.$inferInsert,
      'name' | 'description' | 'parentId' | 'requiresMember'
    >
  >
) {
  const result = await db
    .update(incomeCategories)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(incomeCategories.id, id))
    .returning(selectFields);

  return result[0] ?? null;
}

export async function softDeleteIncomeCategory(id: number) {
  await db
    .update(incomeCategories)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(incomeCategories.id, id), notDeleted(incomeCategories)));
}

export async function restoreIncomeCategory(id: number) {
  const result = await db
    .update(incomeCategories)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(eq(incomeCategories.id, id))
    .returning(selectFields);

  return result[0] ?? null;
}

export async function hasChildrenIncomeCategory(parentId: number): Promise<boolean> {
  const result = await db
    .select({ id: incomeCategories.id })
    .from(incomeCategories)
    .where(and(eq(incomeCategories.parentId, parentId), notDeleted(incomeCategories)))
    .limit(1);
  return result.length > 0;
}
