import { eq, count } from 'drizzle-orm';
import { db } from '../../../../db/index';
import {
  expenseEntries,
  expenseCategories,
  paymentMethods,
  designatedFunds,
  members
} from '../../../../db/schema';

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
  paymentMethodId: expenseEntries.paymentMethodId,
  paymentMethodName: paymentMethods.name,
  designatedFundId: expenseEntries.designatedFundId,
  designatedFundName: designatedFunds.name,
  memberId: expenseEntries.memberId,
  memberName: members.name,
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
    .innerJoin(paymentMethods, eq(expenseEntries.paymentMethodId, paymentMethods.id))
    .leftJoin(designatedFunds, eq(expenseEntries.designatedFundId, designatedFunds.id))
    .leftJoin(members, eq(expenseEntries.memberId, members.id));
}

export async function listExpenseEntries(offset: number, limit: number) {
  const rows = await baseQuery()
    .orderBy(expenseEntries.id)
    .offset(offset)
    .limit(limit);

  const countResult = await db.select({ count: count() }).from(expenseEntries);
  return { rows, total: countResult[0]?.count ?? 0 };
}

export async function findExpenseEntryById(id: number) {
  const result = await baseQuery()
    .where(eq(expenseEntries.id, id))
    .limit(1);

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
  memberId?: number;
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
  const result = await db.insert(expenseEntries).values(insertData).returning({ id: expenseEntries.id });
  const insertedId = result[0]?.id;
  if (!insertedId) throw new Error('Failed to retrieve inserted entry ID');
  return findExpenseEntryById(insertedId);
}

export async function updateExpenseEntry(
  id: number,
  data: Partial<
    Pick<
      typeof expenseEntries.$inferInsert,
      'referenceDate' | 'description' | 'total' | 'amount' | 'installment' | 'totalInstallments' | 'categoryId' | 'paymentMethodId' | 'designatedFundId' | 'memberId' | 'parentId' | 'receipt' | 'notes' | 'status'
    >
  >
) {
  const updateData: Record<string, any> = { ...data };
  if (data.total !== undefined) {
    updateData.total = data.total.toString();
  }
  if (data.amount !== undefined) {
    updateData.amount = data.amount.toString();
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
