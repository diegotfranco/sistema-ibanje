import { eq, count } from 'drizzle-orm';
import { db } from '../../../../db/index';
import {
  incomeEntries,
  incomeCategories,
  members,
  paymentMethods,
  designatedFunds
} from '../../../../db/schema';

const selectFields = {
  id: incomeEntries.id,
  referenceDate: incomeEntries.referenceDate,
  depositDate: incomeEntries.depositDate,
  amount: incomeEntries.amount,
  categoryId: incomeEntries.categoryId,
  categoryName: incomeCategories.name,
  memberId: incomeEntries.memberId,
  memberName: members.name,
  paymentMethodId: incomeEntries.paymentMethodId,
  paymentMethodName: paymentMethods.name,
  designatedFundId: incomeEntries.designatedFundId,
  designatedFundName: designatedFunds.name,
  notes: incomeEntries.notes,
  userId: incomeEntries.userId,
  status: incomeEntries.status,
  createdAt: incomeEntries.createdAt,
  updatedAt: incomeEntries.updatedAt
};

function baseQuery() {
  return db
    .select(selectFields)
    .from(incomeEntries)
    .innerJoin(incomeCategories, eq(incomeEntries.categoryId, incomeCategories.id))
    .innerJoin(paymentMethods, eq(incomeEntries.paymentMethodId, paymentMethods.id))
    .leftJoin(members, eq(incomeEntries.memberId, members.id))
    .leftJoin(designatedFunds, eq(incomeEntries.designatedFundId, designatedFunds.id));
}

export async function listIncomeEntries(offset: number, limit: number) {
  const rows = await baseQuery().orderBy(incomeEntries.id).offset(offset).limit(limit);

  const countResult = await db.select({ count: count() }).from(incomeEntries);
  return { rows, total: countResult[0]?.count ?? 0 };
}

export async function findIncomeEntryById(id: number) {
  const result = await baseQuery().where(eq(incomeEntries.id, id)).limit(1);

  return result[0] ?? null;
}

export async function insertIncomeEntry(data: {
  referenceDate: string;
  depositDate?: string;
  amount: number;
  categoryId: number;
  memberId?: number;
  paymentMethodId: number;
  designatedFundId?: number;
  notes?: string;
  userId: number;
}) {
  const insertData = {
    ...data,
    amount: data.amount.toString()
  };
  const result = await db
    .insert(incomeEntries)
    .values(insertData)
    .returning({ id: incomeEntries.id });
  const insertedId = result[0]?.id;
  if (!insertedId) throw new Error('Failed to retrieve inserted entry ID');
  return findIncomeEntryById(insertedId);
}

export async function updateIncomeEntry(
  id: number,
  data: Partial<
    Pick<
      typeof incomeEntries.$inferInsert,
      | 'referenceDate'
      | 'depositDate'
      | 'amount'
      | 'categoryId'
      | 'memberId'
      | 'paymentMethodId'
      | 'designatedFundId'
      | 'notes'
      | 'status'
    >
  >
) {
  await db
    .update(incomeEntries)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(incomeEntries.id, id));

  return findIncomeEntryById(id);
}

export async function cancelIncomeEntry(id: number) {
  await db
    .update(incomeEntries)
    .set({ status: 'cancelada', updatedAt: new Date() })
    .where(eq(incomeEntries.id, id));
}
