import { eq, gte, lt, sum, count, and, desc, isNotNull, ne, sql } from 'drizzle-orm';
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

// The period is stored as a single YYYYMM int. The rest of the app speaks (year, month),
// so reads decode back into those two fields and writes encode forward — the column shape
// is an implementation detail confined to this repository.
function toPeriodInt(year: number, month: number): number {
  return year * 100 + month;
}

type MonthlyClosingRow = Omit<MonthlyClosing, 'period'> & {
  periodYear: number;
  periodMonth: number;
};

function decode(row: MonthlyClosing): MonthlyClosingRow {
  const { period, ...rest } = row;
  return { ...rest, periodYear: Math.trunc(period / 100), periodMonth: period % 100 };
}

export async function listMonthlyClosings(offset: number, limit: number, year?: number) {
  const condition = year
    ? and(
        gte(monthlyClosings.period, toPeriodInt(year, 1)),
        lt(monthlyClosings.period, toPeriodInt(year + 1, 1))
      )
    : undefined;
  const rows = await db
    .select()
    .from(monthlyClosings)
    .where(condition)
    .orderBy(desc(monthlyClosings.period))
    .offset(offset)
    .limit(limit);

  const countResult = await db.select({ count: count() }).from(monthlyClosings).where(condition);
  return { rows: rows.map(decode), total: countResult[0]?.count ?? 0 };
}

export async function listMonthlyClosingYears(): Promise<number[]> {
  const yearKey = sql<number>`${monthlyClosings.period} / 100`;
  const rows = await db
    .selectDistinct({ year: yearKey })
    .from(monthlyClosings)
    .orderBy(desc(yearKey));
  return rows.map((r) => Number(r.year));
}

export async function findMonthlyClosingById(id: number): Promise<MonthlyClosingRow | null> {
  const result = await db.select().from(monthlyClosings).where(eq(monthlyClosings.id, id)).limit(1);
  return result[0] ? decode(result[0]) : null;
}

export async function findMonthlyClosingByPeriod(
  year: number,
  month: number
): Promise<MonthlyClosingRow | null> {
  const result = await db
    .select()
    .from(monthlyClosings)
    .where(eq(monthlyClosings.period, toPeriodInt(year, month)))
    .limit(1);
  return result[0] ? decode(result[0]) : null;
}

export async function findPreviousFechadoClosing(
  year: number,
  month: number
): Promise<MonthlyClosingRow | null> {
  const result = await db
    .select()
    .from(monthlyClosings)
    .where(
      and(
        eq(monthlyClosings.status, 'fechado'),
        lt(monthlyClosings.period, toPeriodInt(year, month))
      )
    )
    .orderBy(desc(monthlyClosings.period))
    .limit(1);
  return result[0] ? decode(result[0]) : null;
}

export async function findLatestNonAbertoClosing(): Promise<MonthlyClosingRow | null> {
  const result = await db
    .select()
    .from(monthlyClosings)
    .where(ne(monthlyClosings.status, 'aberto'))
    .orderBy(desc(monthlyClosings.period))
    .limit(1);
  return result[0] ? decode(result[0]) : null;
}

export async function insertMonthlyClosing(data: {
  periodYear: number;
  periodMonth: number;
}): Promise<MonthlyClosingRow | null> {
  const result = await db
    .insert(monthlyClosings)
    .values({ period: toPeriodInt(data.periodYear, data.periodMonth) })
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
): Promise<MonthlyClosingRow | null> {
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
        gte(expenseEntries.date, periodStart(year, month)),
        lt(expenseEntries.date, periodEnd(year, month)),
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
          isNotNull(incomeEntries.campaignId)
        )
      ),
    db
      .select({ total: sum(expenseEntries.amount) })
      .from(expenseEntries)
      .where(
        and(
          gte(expenseEntries.date, start),
          lt(expenseEntries.date, end),
          eq(expenseEntries.status, 'paga'),
          isNotNull(expenseEntries.campaignId)
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
          gte(expenseEntries.date, startDate),
          lt(expenseEntries.date, endDate),
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
