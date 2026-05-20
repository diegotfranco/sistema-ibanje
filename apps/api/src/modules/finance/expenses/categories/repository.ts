import { eq, count, sql, type SQL } from 'drizzle-orm';
import { db } from '../../../../db/index.js';
import { expenseCategories } from '../../../../db/schema.js';

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

export async function listExpenseCategories(offset: number, limit: number, q?: string) {
  const where = q ? expenseCategoryNameFilter(q) : undefined;

  const rowsQuery = db
    .select(selectFields)
    .from(expenseCategories)
    .orderBy(expenseCategories.id)
    .offset(offset)
    .limit(limit);
  const rows = await (where ? rowsQuery.where(where) : rowsQuery);

  const countQuery = db.select({ count: count() }).from(expenseCategories);
  const countResult = await (where ? countQuery.where(where) : countQuery);

  return { rows, total: countResult[0]?.count ?? 0 };
}

export async function findExpenseCategoryById(id: number) {
  const result = await db
    .select(selectFields)
    .from(expenseCategories)
    .where(eq(expenseCategories.id, id))
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

export async function deactivateExpenseCategory(id: number) {
  await db
    .update(expenseCategories)
    .set({ status: 'inativo', updatedAt: new Date() })
    .where(eq(expenseCategories.id, id));
}

export async function hasChildrenExpenseCategory(parentId: number): Promise<boolean> {
  const result = await db
    .select({ id: expenseCategories.id })
    .from(expenseCategories)
    .where(eq(expenseCategories.parentId, parentId))
    .limit(1);
  return result.length > 0;
}
