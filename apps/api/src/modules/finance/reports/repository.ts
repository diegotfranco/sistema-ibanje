import { eq, gte, lte, sum, count, and, isNotNull, asc, inArray, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '../../../db/index';
import {
  incomeEntries,
  expenseEntries,
  incomeCategories,
  expenseCategories,
  designatedFunds,
  members
} from '../../../db/schema';
import type {
  IncomeReportRow,
  ExpenseReportRow,
  IncomeByCategoryRow,
  ExpenseByCategoryRow,
  IncomeByFundRow,
  FundIncomeEntry,
  FundExpenseEntry,
  IncomeAggregateRow
} from './schema';

const parentIncomeCat = alias(incomeCategories, 'parent_income_cat');
const parentExpenseCat = alias(expenseCategories, 'parent_expense_cat');

export async function getIncomeReportRows(
  from: string,
  to: string,
  offset: number,
  limit: number
): Promise<IncomeReportRow[]> {
  const rows = await db
    .select({
      referenceDate: incomeEntries.referenceDate,
      categoryId: incomeCategories.id,
      categoryName: incomeCategories.name,
      parentCategoryId: parentIncomeCat.id,
      parentCategoryName: parentIncomeCat.name,
      fundId: designatedFunds.id,
      fundName: designatedFunds.name,
      total: sum(incomeEntries.amount)
    })
    .from(incomeEntries)
    .innerJoin(incomeCategories, eq(incomeEntries.categoryId, incomeCategories.id))
    .leftJoin(parentIncomeCat, eq(incomeCategories.parentId, parentIncomeCat.id))
    .leftJoin(designatedFunds, eq(incomeEntries.designatedFundId, designatedFunds.id))
    .where(
      and(
        gte(incomeEntries.referenceDate, from),
        lte(incomeEntries.referenceDate, to),
        eq(incomeEntries.status, 'paga')
      )
    )
    .groupBy(
      incomeEntries.referenceDate,
      incomeCategories.id,
      incomeCategories.name,
      parentIncomeCat.id,
      parentIncomeCat.name,
      designatedFunds.id,
      designatedFunds.name
    )
    .orderBy(asc(incomeEntries.referenceDate))
    .offset(offset)
    .limit(limit);

  return rows.map((r) => ({
    referenceDate: r.referenceDate,
    categoryId: r.categoryId,
    categoryName: r.categoryName,
    parentCategoryId: r.parentCategoryId ?? null,
    parentCategoryName: r.parentCategoryName ?? null,
    fundId: r.fundId ?? null,
    fundName: r.fundName ?? null,
    total: r.total ?? '0.00'
  }));
}

export async function countIncomeReportRows(from: string, to: string): Promise<number> {
  const grouped = db
    .select({ ref: incomeEntries.referenceDate })
    .from(incomeEntries)
    .where(
      and(
        gte(incomeEntries.referenceDate, from),
        lte(incomeEntries.referenceDate, to),
        eq(incomeEntries.status, 'paga')
      )
    )
    .groupBy(incomeEntries.referenceDate, incomeEntries.categoryId, incomeEntries.designatedFundId)
    .as('grouped');
  const result = await db.select({ count: count() }).from(grouped);
  return result[0]?.count ?? 0;
}

export async function sumIncomeForRange(from: string, to: string): Promise<string> {
  const result = await db
    .select({ total: sum(incomeEntries.amount) })
    .from(incomeEntries)
    .where(
      and(
        gte(incomeEntries.referenceDate, from),
        lte(incomeEntries.referenceDate, to),
        eq(incomeEntries.status, 'paga')
      )
    );
  return result[0]?.total ?? '0.00';
}

export async function getExpenseReportRows(
  from: string,
  to: string,
  offset: number,
  limit: number
): Promise<ExpenseReportRow[]> {
  const rows = await db
    .select({
      id: expenseEntries.id,
      referenceDate: expenseEntries.referenceDate,
      description: expenseEntries.description,
      categoryId: expenseCategories.id,
      categoryName: expenseCategories.name,
      parentCategoryId: parentExpenseCat.id,
      parentCategoryName: parentExpenseCat.name,
      fundId: designatedFunds.id,
      fundName: designatedFunds.name,
      amount: expenseEntries.amount
    })
    .from(expenseEntries)
    .innerJoin(expenseCategories, eq(expenseEntries.categoryId, expenseCategories.id))
    .leftJoin(parentExpenseCat, eq(expenseCategories.parentId, parentExpenseCat.id))
    .leftJoin(designatedFunds, eq(expenseEntries.designatedFundId, designatedFunds.id))
    .where(
      and(
        gte(expenseEntries.referenceDate, from),
        lte(expenseEntries.referenceDate, to),
        eq(expenseEntries.status, 'paga')
      )
    )
    .orderBy(asc(expenseEntries.referenceDate))
    .offset(offset)
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    referenceDate: r.referenceDate,
    description: r.description,
    categoryId: r.categoryId,
    categoryName: r.categoryName,
    parentCategoryId: r.parentCategoryId ?? null,
    parentCategoryName: r.parentCategoryName ?? null,
    fundId: r.fundId ?? null,
    fundName: r.fundName ?? null,
    amount: r.amount
  }));
}

export async function countExpenseReportRows(from: string, to: string): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(expenseEntries)
    .where(
      and(
        gte(expenseEntries.referenceDate, from),
        lte(expenseEntries.referenceDate, to),
        eq(expenseEntries.status, 'paga')
      )
    );
  return result[0]?.count ?? 0;
}

export async function sumExpensesForRange(from: string, to: string): Promise<string> {
  const result = await db
    .select({ total: sum(expenseEntries.amount) })
    .from(expenseEntries)
    .where(
      and(
        gte(expenseEntries.referenceDate, from),
        lte(expenseEntries.referenceDate, to),
        eq(expenseEntries.status, 'paga')
      )
    );
  return result[0]?.total ?? '0.00';
}

export async function getIncomeByCategoryForRange(
  from: string,
  to: string
): Promise<IncomeByCategoryRow[]> {
  const rows = await db
    .select({
      parentCategoryId: parentIncomeCat.id,
      parentCategoryName: parentIncomeCat.name,
      categoryId: incomeCategories.id,
      categoryName: incomeCategories.name,
      total: sum(incomeEntries.amount)
    })
    .from(incomeEntries)
    .innerJoin(incomeCategories, eq(incomeEntries.categoryId, incomeCategories.id))
    .leftJoin(parentIncomeCat, eq(incomeCategories.parentId, parentIncomeCat.id))
    .where(
      and(
        gte(incomeEntries.referenceDate, from),
        lte(incomeEntries.referenceDate, to),
        eq(incomeEntries.status, 'paga')
      )
    )
    .groupBy(incomeCategories.id, incomeCategories.name, parentIncomeCat.id, parentIncomeCat.name);

  return rows.map((r) => ({
    parentCategoryId: r.parentCategoryId ?? null,
    parentCategoryName: r.parentCategoryName ?? null,
    categoryId: r.categoryId,
    categoryName: r.categoryName,
    total: r.total ?? '0.00'
  }));
}

export async function getIncomeByFundForRange(
  from: string,
  to: string
): Promise<IncomeByFundRow[]> {
  const rows = await db
    .select({
      fundId: designatedFunds.id,
      fundName: designatedFunds.name,
      total: sum(incomeEntries.amount)
    })
    .from(incomeEntries)
    .innerJoin(designatedFunds, eq(incomeEntries.designatedFundId, designatedFunds.id))
    .where(
      and(
        gte(incomeEntries.referenceDate, from),
        lte(incomeEntries.referenceDate, to),
        eq(incomeEntries.status, 'paga'),
        isNotNull(incomeEntries.designatedFundId)
      )
    )
    .groupBy(designatedFunds.id, designatedFunds.name);

  return rows.map((r) => ({
    fundId: r.fundId,
    fundName: r.fundName,
    total: r.total ?? '0.00'
  }));
}

export async function getExpensesByCategoryForRange(
  from: string,
  to: string
): Promise<ExpenseByCategoryRow[]> {
  const rows = await db
    .select({
      parentCategoryId: parentExpenseCat.id,
      parentCategoryName: parentExpenseCat.name,
      categoryId: expenseCategories.id,
      categoryName: expenseCategories.name,
      total: sum(expenseEntries.amount)
    })
    .from(expenseEntries)
    .innerJoin(expenseCategories, eq(expenseEntries.categoryId, expenseCategories.id))
    .leftJoin(parentExpenseCat, eq(expenseCategories.parentId, parentExpenseCat.id))
    .where(
      and(
        gte(expenseEntries.referenceDate, from),
        lte(expenseEntries.referenceDate, to),
        eq(expenseEntries.status, 'paga')
      )
    )
    .groupBy(
      expenseCategories.id,
      expenseCategories.name,
      parentExpenseCat.id,
      parentExpenseCat.name
    );

  return rows.map((r) => ({
    parentCategoryId: r.parentCategoryId ?? null,
    parentCategoryName: r.parentCategoryName ?? null,
    categoryId: r.categoryId,
    categoryName: r.categoryName,
    total: r.total ?? '0.00'
  }));
}

export async function getIncomeAggregatesForRange(
  from: string,
  to: string
): Promise<IncomeAggregateRow[]> {
  const colKind = sql<
    'category' | 'fund'
  >`CASE WHEN ${incomeEntries.designatedFundId} IS NULL THEN 'category' ELSE 'fund' END`;
  const colRefId = sql<number>`COALESCE(${incomeEntries.designatedFundId}, ${incomeEntries.categoryId})`;
  const colLabel = sql<string>`COALESCE(${designatedFunds.name}, ${incomeCategories.name})`;

  const rows = await db
    .select({
      referenceDate: incomeEntries.referenceDate,
      columnKind: colKind,
      columnRefId: colRefId,
      columnLabel: colLabel,
      total: sum(incomeEntries.amount)
    })
    .from(incomeEntries)
    .innerJoin(incomeCategories, eq(incomeEntries.categoryId, incomeCategories.id))
    .leftJoin(designatedFunds, eq(incomeEntries.designatedFundId, designatedFunds.id))
    .where(
      and(
        gte(incomeEntries.referenceDate, from),
        lte(incomeEntries.referenceDate, to),
        eq(incomeEntries.status, 'paga')
      )
    )
    .groupBy(incomeEntries.referenceDate, colKind, colRefId, colLabel)
    .orderBy(asc(incomeEntries.referenceDate));

  return rows.map((r) => ({
    referenceDate: r.referenceDate,
    columnKind: r.columnKind,
    columnRefId: r.columnRefId,
    columnLabel: r.columnLabel,
    total: r.total ?? '0.00'
  }));
}

export async function getAllExpenseReportRows(
  from: string,
  to: string
): Promise<ExpenseReportRow[]> {
  const rows = await db
    .select({
      id: expenseEntries.id,
      referenceDate: expenseEntries.referenceDate,
      description: expenseEntries.description,
      categoryId: expenseCategories.id,
      categoryName: expenseCategories.name,
      parentCategoryId: parentExpenseCat.id,
      parentCategoryName: parentExpenseCat.name,
      fundId: designatedFunds.id,
      fundName: designatedFunds.name,
      amount: expenseEntries.amount
    })
    .from(expenseEntries)
    .innerJoin(expenseCategories, eq(expenseEntries.categoryId, expenseCategories.id))
    .leftJoin(parentExpenseCat, eq(expenseCategories.parentId, parentExpenseCat.id))
    .leftJoin(designatedFunds, eq(expenseEntries.designatedFundId, designatedFunds.id))
    .where(
      and(
        gte(expenseEntries.referenceDate, from),
        lte(expenseEntries.referenceDate, to),
        eq(expenseEntries.status, 'paga')
      )
    )
    .orderBy(asc(expenseEntries.referenceDate));

  return rows.map((r) => ({
    id: r.id,
    referenceDate: r.referenceDate,
    description: r.description,
    categoryId: r.categoryId,
    categoryName: r.categoryName,
    parentCategoryId: r.parentCategoryId ?? null,
    parentCategoryName: r.parentCategoryName ?? null,
    fundId: r.fundId ?? null,
    fundName: r.fundName ?? null,
    amount: r.amount
  }));
}

export async function countActiveMembers(): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(members)
    .where(eq(members.status, 'ativo'));
  return result[0]?.count ?? 0;
}

export async function countDistinctMembersWithTithe(
  from: string,
  to: string,
  titheIds: number[]
): Promise<number> {
  if (titheIds.length === 0) return 0;
  const result = await db
    .selectDistinct({ memberId: incomeEntries.memberId })
    .from(incomeEntries)
    .where(
      and(
        gte(incomeEntries.referenceDate, from),
        lte(incomeEntries.referenceDate, to),
        eq(incomeEntries.status, 'paga'),
        inArray(incomeEntries.categoryId, titheIds),
        isNotNull(incomeEntries.memberId)
      )
    );
  return result.length;
}

export async function countDistinctMembersWithOfferings(
  from: string,
  to: string,
  offeringIds: number[]
): Promise<number> {
  if (offeringIds.length === 0) return 0;
  const result = await db
    .selectDistinct({ memberId: incomeEntries.memberId })
    .from(incomeEntries)
    .where(
      and(
        gte(incomeEntries.referenceDate, from),
        lte(incomeEntries.referenceDate, to),
        eq(incomeEntries.status, 'paga'),
        inArray(incomeEntries.categoryId, offeringIds),
        isNotNull(incomeEntries.memberId)
      )
    );
  return result.length;
}

export async function findIncomeCategoryIdsByNames(names: string[]): Promise<number[]> {
  const rows = await db
    .select({ id: incomeCategories.id })
    .from(incomeCategories)
    .where(inArray(incomeCategories.name, names));
  return rows.map((r) => r.id);
}

export async function findAllActiveFunds() {
  return db.select().from(designatedFunds).where(eq(designatedFunds.status, 'ativo'));
}

export async function findFundById(id: number) {
  const result = await db.select().from(designatedFunds).where(eq(designatedFunds.id, id)).limit(1);
  return result[0] ?? null;
}

export async function sumAllTimeIncomePerFund(): Promise<Map<number, string>> {
  const rows = await db
    .select({ fundId: incomeEntries.designatedFundId, total: sum(incomeEntries.amount) })
    .from(incomeEntries)
    .where(and(eq(incomeEntries.status, 'paga'), isNotNull(incomeEntries.designatedFundId)))
    .groupBy(incomeEntries.designatedFundId);

  const map = new Map<number, string>();
  for (const r of rows) {
    if (r.fundId !== null) map.set(r.fundId, r.total ?? '0.00');
  }
  return map;
}

export async function sumAllTimeExpensesPerFund(): Promise<Map<number, string>> {
  const rows = await db
    .select({ fundId: expenseEntries.designatedFundId, total: sum(expenseEntries.amount) })
    .from(expenseEntries)
    .where(and(eq(expenseEntries.status, 'paga'), isNotNull(expenseEntries.designatedFundId)))
    .groupBy(expenseEntries.designatedFundId);

  const map = new Map<number, string>();
  for (const r of rows) {
    if (r.fundId !== null) map.set(r.fundId, r.total ?? '0.00');
  }
  return map;
}

export async function sumAllTimeIncomeForFund(fundId: number): Promise<string> {
  const result = await db
    .select({ total: sum(incomeEntries.amount) })
    .from(incomeEntries)
    .where(and(eq(incomeEntries.status, 'paga'), eq(incomeEntries.designatedFundId, fundId)));
  return result[0]?.total ?? '0.00';
}

export async function sumAllTimeExpensesForFund(fundId: number): Promise<string> {
  const result = await db
    .select({ total: sum(expenseEntries.amount) })
    .from(expenseEntries)
    .where(and(eq(expenseEntries.status, 'paga'), eq(expenseEntries.designatedFundId, fundId)));
  return result[0]?.total ?? '0.00';
}

export async function getFundIncomeEntries(fundId: number): Promise<FundIncomeEntry[]> {
  const rows = await db
    .select({
      id: incomeEntries.id,
      referenceDate: incomeEntries.referenceDate,
      amount: incomeEntries.amount,
      categoryName: incomeCategories.name,
      memberName: members.name,
      notes: incomeEntries.notes
    })
    .from(incomeEntries)
    .innerJoin(incomeCategories, eq(incomeEntries.categoryId, incomeCategories.id))
    .leftJoin(members, eq(incomeEntries.memberId, members.id))
    .where(and(eq(incomeEntries.designatedFundId, fundId), eq(incomeEntries.status, 'paga')))
    .orderBy(asc(incomeEntries.referenceDate));

  return rows.map((r) => ({
    id: r.id,
    referenceDate: r.referenceDate,
    amount: r.amount,
    categoryName: r.categoryName,
    memberName: r.memberName ?? null,
    notes: r.notes ?? null
  }));
}

export async function getFundExpenseEntries(fundId: number): Promise<FundExpenseEntry[]> {
  const rows = await db
    .select({
      id: expenseEntries.id,
      referenceDate: expenseEntries.referenceDate,
      description: expenseEntries.description,
      amount: expenseEntries.amount,
      categoryName: expenseCategories.name,
      notes: expenseEntries.notes
    })
    .from(expenseEntries)
    .innerJoin(expenseCategories, eq(expenseEntries.categoryId, expenseCategories.id))
    .where(and(eq(expenseEntries.designatedFundId, fundId), eq(expenseEntries.status, 'paga')))
    .orderBy(asc(expenseEntries.referenceDate));

  return rows.map((r) => ({
    id: r.id,
    referenceDate: r.referenceDate,
    description: r.description,
    amount: r.amount,
    categoryName: r.categoryName,
    notes: r.notes ?? null
  }));
}
