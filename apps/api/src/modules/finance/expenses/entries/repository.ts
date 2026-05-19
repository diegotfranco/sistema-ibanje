import { eq, count, and, gte, lte, sum, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '../../../../db/index.js';
import {
  expenseEntries,
  expenseCategories,
  paymentMethods,
  designatedFunds,
  attenders
} from '../../../../db/schema.js';

const parentExpenseCategories = alias(expenseCategories, 'parent_expense_categories');

const selectFields = {
  id: expenseEntries.id,
  parentId: expenseEntries.parentId,
  referenceDate: expenseEntries.referenceDate,
  description: expenseEntries.description,
  total: expenseEntries.total,
  amount: expenseEntries.amount,
  installment: expenseEntries.installment,
  totalInstallments: expenseEntries.totalInstallments,
  categoryId: expenseEntries.categoryId,
  categoryName: expenseCategories.name,
  parentCategoryId: parentExpenseCategories.id,
  parentCategoryName: parentExpenseCategories.name,
  paymentMethodId: expenseEntries.paymentMethodId,
  paymentMethodName: paymentMethods.name,
  designatedFundId: expenseEntries.designatedFundId,
  designatedFundName: designatedFunds.name,
  attenderId: expenseEntries.attenderId,
  attenderName: attenders.name,
  receipt: expenseEntries.receipt,
  notes: expenseEntries.notes,
  userId: expenseEntries.userId,
  status: expenseEntries.status,
  createdAt: expenseEntries.createdAt,
  updatedAt: expenseEntries.updatedAt
};

function baseQuery() {
  return db
    .select(selectFields)
    .from(expenseEntries)
    .innerJoin(expenseCategories, eq(expenseEntries.categoryId, expenseCategories.id))
    .leftJoin(parentExpenseCategories, eq(parentExpenseCategories.id, expenseCategories.parentId))
    .innerJoin(paymentMethods, eq(expenseEntries.paymentMethodId, paymentMethods.id))
    .leftJoin(designatedFunds, eq(expenseEntries.designatedFundId, designatedFunds.id))
    .leftJoin(attenders, eq(expenseEntries.attenderId, attenders.id));
}

export async function listExpenseEntries(offset: number, limit: number) {
  const rows = await baseQuery().orderBy(expenseEntries.id).offset(offset).limit(limit);

  const countResult = await db.select({ count: count() }).from(expenseEntries);
  return { rows, total: countResult[0]?.count ?? 0 };
}

export async function findExpenseEntryById(id: number) {
  const result = await baseQuery().where(eq(expenseEntries.id, id)).limit(1);

  return result[0] ?? null;
}

export async function insertExpenseEntry(data: {
  referenceDate: string;
  description: string;
  total: number;
  amount: number;
  installment?: number;
  totalInstallments?: number;
  categoryId: number;
  paymentMethodId: number;
  designatedFundId?: number;
  attenderId?: number;
  parentId?: number;
  receipt?: string;
  notes?: string;
  userId: number;
}) {
  const insertData = {
    ...data,
    total: data.total.toString(),
    amount: data.amount.toString()
  };
  const result = await db
    .insert(expenseEntries)
    .values(insertData)
    .returning({ id: expenseEntries.id });
  const insertedId = result[0]?.id;
  if (!insertedId) throw new Error('Failed to retrieve inserted entry ID');
  return findExpenseEntryById(insertedId);
}

export async function updateExpenseEntry(
  id: number,
  data: Partial<
    Pick<
      typeof expenseEntries.$inferInsert,
      | 'referenceDate'
      | 'description'
      | 'total'
      | 'amount'
      | 'installment'
      | 'totalInstallments'
      | 'categoryId'
      | 'paymentMethodId'
      | 'designatedFundId'
      | 'attenderId'
      | 'parentId'
      | 'receipt'
      | 'notes'
      | 'status'
    >
  >
) {
  const updateData: Partial<typeof expenseEntries.$inferInsert> = { ...data };
  if (data.total !== undefined) {
    updateData.total = String(data.total);
  }
  if (data.amount !== undefined) {
    updateData.amount = String(data.amount);
  }

  await db
    .update(expenseEntries)
    .set({ ...updateData, updatedAt: new Date() })
    .where(eq(expenseEntries.id, id));

  return findExpenseEntryById(id);
}

export async function cancelExpenseEntry(id: number) {
  await db
    .update(expenseEntries)
    .set({ status: 'cancelada', updatedAt: new Date() })
    .where(eq(expenseEntries.id, id));
}

export async function updateReceiptKey(id: number, key: string | null) {
  await db
    .update(expenseEntries)
    .set({ receipt: key, updatedAt: new Date() })
    .where(eq(expenseEntries.id, id));
}

export async function summarizeExpensesByTopLevelCategory(
  from: string,
  to: string
): Promise<{ categoryId: number; categoryName: string; total: string }[]> {
  const parentCategories = alias(expenseCategories, 'parent_categories');

  const rows = await db
    .select({
      categoryId: sql<number>`coalesce(${expenseCategories.parentId}, ${expenseCategories.id})`,
      categoryName: sql<string>`coalesce(${parentCategories.name}, ${expenseCategories.name})`,
      total: sum(expenseEntries.amount).mapWith(String)
    })
    .from(expenseEntries)
    .innerJoin(expenseCategories, eq(expenseEntries.categoryId, expenseCategories.id))
    .leftJoin(parentCategories, eq(parentCategories.id, expenseCategories.parentId))
    .where(
      and(
        eq(expenseEntries.status, 'paga'),
        gte(expenseEntries.referenceDate, from),
        lte(expenseEntries.referenceDate, to)
      )
    )
    .groupBy(
      sql`coalesce(${expenseCategories.parentId}, ${expenseCategories.id})`,
      sql`coalesce(${parentCategories.name}, ${expenseCategories.name})`
    )
    .orderBy(sql`coalesce(${parentCategories.name}, ${expenseCategories.name})`);

  return rows;
}
