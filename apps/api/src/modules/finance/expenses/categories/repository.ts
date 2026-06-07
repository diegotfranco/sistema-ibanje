import { eq, count, sql, and, type SQL } from 'drizzle-orm';
import { db } from '../../../../db/index.js';
import { expenseCategories } from '../../../../db/schema.js';
import { notDeleted, deletedClause, type DeletedFilter } from '../../../../lib/softDelete.js';

const selectFields = {
  id: expenseCategories.id,
  parentId: expenseCategories.parentId,
  name: expenseCategories.name,
  description: expenseCategories.description,
  status: expenseCategories.status,
  createdAt: expenseCategories.createdAt
};

// Diacritic+case-insensitive match against own name, or against the name of a
// row's parent/child. Implemented as a single correlated EXISTS so the row's
// "is included because it matched OR because a relative matched" logic lives
// in one place. Requires the `unaccent` extension (migration 0003).
function expenseCategoryNameFilter(q: string): SQL {
  const pattern = `%${q}%`;
  return sql`EXISTS (
    SELECT 1 FROM ${expenseCategories} AS m
    WHERE unaccent(lower(m.name)) LIKE unaccent(lower(${pattern}))
      AND (
        m.id = ${expenseCategories.id}
        OR m.id = ${expenseCategories.parentId}
        OR m.parent_id = ${expenseCategories.id}
      )
  )`;
}

export async function listExpenseCategories(
  offset: number,
  limit: number,
  q?: string,
  deleted?: DeletedFilter
) {
  const deletedCondition = deletedClause(expenseCategories, deleted);
  const where = q ? and(deletedCondition, expenseCategoryNameFilter(q)) : deletedCondition;

  const rows = await db
    .select(selectFields)
    .from(expenseCategories)
    .where(where)
    .orderBy(expenseCategories.id)
    .offset(offset)
    .limit(limit);

  const countResult = await db.select({ count: count() }).from(expenseCategories).where(where);

  return { rows, total: countResult[0]?.count ?? 0 };
}

export async function findExpenseCategoryById(id: number) {
  const result = await db
    .select(selectFields)
    .from(expenseCategories)
    .where(and(eq(expenseCategories.id, id), notDeleted(expenseCategories)))
    .limit(1);

  return result[0] ?? null;
}

export async function insertExpenseCategory(data: {
  name: string;
  description?: string;
  parentId?: number;
}) {
  const result = await db.insert(expenseCategories).values(data).returning(selectFields);
  return result[0] ?? null;
}

export async function updateExpenseCategory(
  id: number,
  data: Partial<Pick<typeof expenseCategories.$inferInsert, 'name' | 'description' | 'parentId'>>
) {
  const result = await db
    .update(expenseCategories)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(expenseCategories.id, id))
    .returning(selectFields);

  return result[0] ?? null;
}

export async function softDeleteExpenseCategory(id: number) {
  await db
    .update(expenseCategories)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(expenseCategories.id, id), notDeleted(expenseCategories)));
}

export async function restoreExpenseCategory(id: number) {
  const result = await db
    .update(expenseCategories)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(eq(expenseCategories.id, id))
    .returning(selectFields);

  return result[0] ?? null;
}

export async function hasChildrenExpenseCategory(parentId: number): Promise<boolean> {
  const result = await db
    .select({ id: expenseCategories.id })
    .from(expenseCategories)
    .where(and(eq(expenseCategories.parentId, parentId), notDeleted(expenseCategories)))
    .limit(1);
  return result.length > 0;
}
