import { eq, count } from 'drizzle-orm';
import { db } from '../../../../db/index';
import { incomeCategories } from '../../../../db/schema';

const selectFields = {
  id: incomeCategories.id,
  parentId: incomeCategories.parentId,
  name: incomeCategories.name,
  description: incomeCategories.description,
  requiresMember: incomeCategories.requiresMember,
  status: incomeCategories.status,
  createdAt: incomeCategories.createdAt
};

export async function listIncomeCategories(offset: number, limit: number) {
  const rows = await db
    .select(selectFields)
    .from(incomeCategories)
    .orderBy(incomeCategories.id)
    .offset(offset)
    .limit(limit);

  const countResult = await db.select({ count: count() }).from(incomeCategories);
  return { rows, total: countResult[0]?.count ?? 0 };
}

export async function findIncomeCategoryById(id: number) {
  const result = await db
    .select(selectFields)
    .from(incomeCategories)
    .where(eq(incomeCategories.id, id))
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

export async function deactivateIncomeCategory(id: number) {
  await db
    .update(incomeCategories)
    .set({ status: 'inativo', updatedAt: new Date() })
    .where(eq(incomeCategories.id, id));
}

export async function hasChildrenIncomeCategory(parentId: number): Promise<boolean> {
  const result = await db
    .select({ id: incomeCategories.id })
    .from(incomeCategories)
    .where(eq(incomeCategories.parentId, parentId))
    .limit(1);
  return result.length > 0;
}
