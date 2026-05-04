import { eq, count } from 'drizzle-orm';
import { db } from '../../../../db/index';
import { expenseCategories } from '../../../../db/schema';

const selectFields = {
  id: expenseCategories.id,
  parentId: expenseCategories.parentId,
  name: expenseCategories.name,
  description: expenseCategories.description,
  status: expenseCategories.status,
  createdAt: expenseCategories.createdAt
};

export async function listExpenseCategories(offset: number, limit: number) {
  const rows = await db
    .select(selectFields)
    .from(expenseCategories)
    .orderBy(expenseCategories.id)
    .offset(offset)
    .limit(limit);

  const countResult = await db.select({ count: count() }).from(expenseCategories);
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
