import { eq, gte, lt, sum, count, and, or, desc, isNotNull } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import {
  monthlyClosings,
  incomeEntries,
  expenseEntries,
  financeSettings,
  type MonthlyClosing
} from '../../../db/schema.js';

export function periodStart(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

export function periodEnd(year: number, month: number): string {
  if (month === 12) return `${year + 1}-01-01`;
  return `${year}-${String(month + 1).padStart(2, '0')}-01`;
}

export async function listMonthlyClosings(offset: number, limit: number) {
  const rows = await db
    .select()
    .from(monthlyClosings)
    .orderBy(desc(monthlyClosings.periodYear), desc(monthlyClosings.periodMonth))
    .offset(offset)
    .limit(limit);

  const countResult = await db.select({ count: count() }).from(monthlyClosings);
  return { rows, total: countResult[0]?.count ?? 0 };
}

export async function findMonthlyClosingById(id: number): Promise<MonthlyClosing | null> {
  const result = await db.select().from(monthlyClosings).where(eq(monthlyClosings.id, id)).limit(1);
  return result[0] ?? null;
}

export async function findMonthlyClosingByPeriod(
  year: number,
  month: number
): Promise<MonthlyClosing | null> {
  const result = await db
    .select()
    .from(monthlyClosings)
    .where(and(eq(monthlyClosings.periodYear, year), eq(monthlyClosings.periodMonth, month)))
    .limit(1);
  return result[0] ?? null;
}

export async function findPreviousFechadoClosing(
  year: number,
  month: number
): Promise<MonthlyClosing | null> {
  const result = await db
    .select()
    .from(monthlyClosings)
    .where(
      and(
        eq(monthlyClosings.status, 'fechado'),
        or(
          lt(monthlyClosings.periodYear, year),
          and(eq(monthlyClosings.periodYear, year), lt(monthlyClosings.periodMonth, month))
        )
      )
    )
    .orderBy(desc(monthlyClosings.periodYear), desc(monthlyClosings.periodMonth))
    .limit(1);
  return result[0] ?? null;
}

export async function insertMonthlyClosing(data: {
  periodYear: number;
  periodMonth: number;
}): Promise<MonthlyClosing | null> {
  const result = await db
    .insert(monthlyClosings)
    .values(data)
    .returning({ id: monthlyClosings.id });
  const insertedId = result[0]?.id;
  if (!insertedId) throw new Error('Failed to retrieve inserted closing ID');
  return findMonthlyClosingById(insertedId);
}

export async function updateMonthlyClosing(
  id: number,
  data: Partial<
    Pick<
      typeof monthlyClosings.$inferInsert,
      | 'status'
      | 'closingBalance'
      | 'treasurerNotes'
      | 'accountantNotes'
      | 'submittedByUserId'
      | 'submittedAt'
      | 'reviewedAt'
      | 'closedByUserId'
      | 'closedAt'
    >
  >
): Promise<MonthlyClosing | null> {
  await db
    .update(monthlyClosings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(monthlyClosings.id, id));
  return findMonthlyClosingById(id);
}

export async function deleteMonthlyClosing(id: number) {
  await db.delete(monthlyClosings).where(eq(monthlyClosings.id, id));
}

export async function sumIncomeForPeriod(year: number, month: number): Promise<string> {
  const result = await db
    .select({ total: sum(incomeEntries.amount) })
    .from(incomeEntries)
    .where(
      and(
        gte(incomeEntries.referenceDate, periodStart(year, month)),
        lt(incomeEntries.referenceDate, periodEnd(year, month)),
        eq(incomeEntries.status, 'paga')
      )
    );
  return result[0]?.total ?? '0';
}

export async function sumExpensesForPeriod(year: number, month: number): Promise<string> {
  const result = await db
    .select({ total: sum(expenseEntries.amount) })
    .from(expenseEntries)
    .where(
      and(
        gte(expenseEntries.referenceDate, periodStart(year, month)),
        lt(expenseEntries.referenceDate, periodEnd(year, month)),
        eq(expenseEntries.status, 'paga')
      )
    );
  return result[0]?.total ?? '0';
}

export async function getTotalReservedFunds(year: number, month: number): Promise<string> {
  const start = periodStart(year, month);
  const end = periodEnd(year, month);

  const [incomeResult, expensesResult] = await Promise.all([
    db
      .select({ total: sum(incomeEntries.amount) })
      .from(incomeEntries)
      .where(
        and(
          gte(incomeEntries.referenceDate, start),
          lt(incomeEntries.referenceDate, end),
          eq(incomeEntries.status, 'paga'),
          isNotNull(incomeEntries.designatedFundId)
        )
      ),
    db
      .select({ total: sum(expenseEntries.amount) })
      .from(expenseEntries)
      .where(
        and(
          gte(expenseEntries.referenceDate, start),
          lt(expenseEntries.referenceDate, end),
          eq(expenseEntries.status, 'paga'),
          isNotNull(expenseEntries.designatedFundId)
        )
      )
  ]);

  const totalIncome = Number.parseFloat(incomeResult[0]?.total ?? '0');
  const totalExpenses = Number.parseFloat(expensesResult[0]?.total ?? '0');
  return (totalIncome - totalExpenses).toFixed(2);
}

export async function sumNetForDateRange(startDate: string, endDate: string): Promise<string> {
  const [incomeResult, expensesResult] = await Promise.all([
    db
      .select({ total: sum(incomeEntries.amount) })
      .from(incomeEntries)
      .where(
        and(
          gte(incomeEntries.referenceDate, startDate),
          lt(incomeEntries.referenceDate, endDate),
          eq(incomeEntries.status, 'paga')
        )
      ),
    db
      .select({ total: sum(expenseEntries.amount) })
      .from(expenseEntries)
      .where(
        and(
          gte(expenseEntries.referenceDate, startDate),
          lt(expenseEntries.referenceDate, endDate),
          eq(expenseEntries.status, 'paga')
        )
      )
  ]);

  const totalIncome = Number.parseFloat(incomeResult[0]?.total ?? '0');
  const totalExpenses = Number.parseFloat(expensesResult[0]?.total ?? '0');
  return (totalIncome - totalExpenses).toFixed(2);
}

export async function findFinanceSettings() {
  const result = await db.select().from(financeSettings).where(eq(financeSettings.id, 1)).limit(1);
  return result[0] ?? null;
}
