import {
  eq,
  ne,
  gte,
  lte,
  sum,
  count,
  and,
  or,
  isNull,
  isNotNull,
  asc,
  desc,
  inArray,
  sql
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '../../../db/index.js';
import {
  incomeEntries,
  expenseEntries,
  incomeCategories,
  expenseCategories,
  campaigns,
  paymentMethods,
  attenders,
  events
} from '../../../db/schema.js';
import type {
  IncomeReportRow,
  ExpenseReportRow,
  IncomeByCategoryRow,
  ExpenseByCategoryRow,
  IncomeByCampaignRow,
  CampaignIncomeEntry,
  CampaignExpenseEntry,
  EventIncomeEntry,
  EventExpenseEntry,
  IncomeAggregateRow
} from './schema.js';
import { CampaignStatus } from '@sistema-ibanje/shared';
import { notDeleted } from '../../../lib/softDelete.js';

const parentIncomeCat = alias(incomeCategories, 'parent_income_cat');
const parentExpenseCat = alias(expenseCategories, 'parent_expense_cat');

type EntryStatus = 'pendente' | 'paga' | 'cancelada';

// When `status` is provided, filter exactly to it (overriding the default
// exclusion of cancelled). When absent, fall back to the default per call site:
// row queries exclude 'cancelada'; sum queries restrict to 'paga'.
function incomeStatusFilter(status: EntryStatus | undefined, defaultExpr: ReturnType<typeof eq>) {
  return status ? eq(incomeEntries.status, status) : defaultExpr;
}

function expenseStatusFilter(status: EntryStatus | undefined, defaultExpr: ReturnType<typeof eq>) {
  return status ? eq(expenseEntries.status, status) : defaultExpr;
}

export async function getIncomeReportRows(
  from: string,
  to: string,
  offset: number,
  limit: number,
  status?: EntryStatus
): Promise<IncomeReportRow[]> {
  const rows = await db
    .select({
      id: incomeEntries.id,
      referenceDate: incomeEntries.referenceDate,
      depositDate: incomeEntries.depositDate,
      amount: incomeEntries.amount,
      categoryId: incomeCategories.id,
      categoryName: incomeCategories.name,
      parentCategoryId: parentIncomeCat.id,
      parentCategoryName: parentIncomeCat.name,
      campaignId: campaigns.id,
      campaignName: campaigns.name,
      attenderId: attenders.id,
      attenderName: attenders.name,
      paymentMethodName: paymentMethods.name,
      notes: incomeEntries.notes,
      status: incomeEntries.status
    })
    .from(incomeEntries)
    .innerJoin(incomeCategories, eq(incomeEntries.categoryId, incomeCategories.id))
    .leftJoin(parentIncomeCat, eq(incomeCategories.parentId, parentIncomeCat.id))
    .leftJoin(campaigns, eq(incomeEntries.campaignId, campaigns.id))
    .leftJoin(attenders, eq(incomeEntries.attenderId, attenders.id))
    .innerJoin(paymentMethods, eq(incomeEntries.paymentMethodId, paymentMethods.id))
    .where(
      and(
        gte(incomeEntries.referenceDate, from),
        lte(incomeEntries.referenceDate, to),
        incomeStatusFilter(status, ne(incomeEntries.status, 'cancelada'))
      )
    )
    .orderBy(
      sql`COALESCE(${incomeEntries.depositDate}, ${incomeEntries.referenceDate}) DESC`,
      desc(incomeEntries.id)
    )
    .offset(offset)
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    referenceDate: r.referenceDate,
    depositDate: r.depositDate,
    amount: r.amount,
    categoryId: r.categoryId,
    categoryName: r.categoryName,
    parentCategoryId: r.parentCategoryId ?? null,
    parentCategoryName: r.parentCategoryName ?? null,
    campaignId: r.campaignId ?? null,
    campaignName: r.campaignName ?? null,
    attenderId: r.attenderId ?? null,
    attenderName: r.attenderName ?? null,
    paymentMethodName: r.paymentMethodName,
    notes: r.notes ?? null,
    status: r.status
  }));
}

export async function countIncomeReportRows(
  from: string,
  to: string,
  status?: EntryStatus
): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(incomeEntries)
    .where(
      and(
        gte(incomeEntries.referenceDate, from),
        lte(incomeEntries.referenceDate, to),
        incomeStatusFilter(status, ne(incomeEntries.status, 'cancelada'))
      )
    );
  return result[0]?.count ?? 0;
}

export async function sumIncomeForRange(
  from: string,
  to: string,
  status?: EntryStatus
): Promise<string> {
  const result = await db
    .select({ total: sum(incomeEntries.amount) })
    .from(incomeEntries)
    .where(
      and(
        gte(incomeEntries.referenceDate, from),
        lte(incomeEntries.referenceDate, to),
        incomeStatusFilter(status, eq(incomeEntries.status, 'paga'))
      )
    );
  return result[0]?.total ?? '0.00';
}

export async function getExpenseReportRows(
  from: string,
  to: string,
  offset: number,
  limit: number,
  status?: EntryStatus
): Promise<ExpenseReportRow[]> {
  const rows = await db
    .select({
      id: expenseEntries.id,
      date: expenseEntries.date,
      categoryId: expenseCategories.id,
      categoryName: expenseCategories.name,
      parentCategoryId: parentExpenseCat.id,
      parentCategoryName: parentExpenseCat.name,
      campaignId: campaigns.id,
      campaignName: campaigns.name,
      attenderId: attenders.id,
      attenderName: attenders.name,
      paymentMethodName: paymentMethods.name,
      installment: expenseEntries.installment,
      totalInstallments: expenseEntries.totalInstallments,
      receipt: expenseEntries.receipt,
      notes: expenseEntries.notes,
      amount: expenseEntries.amount,
      status: expenseEntries.status
    })
    .from(expenseEntries)
    .innerJoin(expenseCategories, eq(expenseEntries.categoryId, expenseCategories.id))
    .leftJoin(parentExpenseCat, eq(expenseCategories.parentId, parentExpenseCat.id))
    .leftJoin(campaigns, eq(expenseEntries.campaignId, campaigns.id))
    .leftJoin(attenders, eq(expenseEntries.attenderId, attenders.id))
    .innerJoin(paymentMethods, eq(expenseEntries.paymentMethodId, paymentMethods.id))
    .where(
      and(
        gte(expenseEntries.date, from),
        lte(expenseEntries.date, to),
        expenseStatusFilter(status, ne(expenseEntries.status, 'cancelada'))
      )
    )
    .orderBy(asc(expenseEntries.date))
    .offset(offset)
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    categoryId: r.categoryId,
    categoryName: r.categoryName,
    parentCategoryId: r.parentCategoryId ?? null,
    parentCategoryName: r.parentCategoryName ?? null,
    campaignId: r.campaignId ?? null,
    campaignName: r.campaignName ?? null,
    attenderId: r.attenderId ?? null,
    attenderName: r.attenderName ?? null,
    paymentMethodName: r.paymentMethodName,
    installment: r.installment,
    totalInstallments: r.totalInstallments,
    hasReceipt: r.receipt !== null,
    notes: r.notes ?? null,
    amount: r.amount,
    status: r.status
  }));
}

export async function countExpenseReportRows(
  from: string,
  to: string,
  status?: EntryStatus
): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(expenseEntries)
    .where(
      and(
        gte(expenseEntries.date, from),
        lte(expenseEntries.date, to),
        expenseStatusFilter(status, ne(expenseEntries.status, 'cancelada'))
      )
    );
  return result[0]?.count ?? 0;
}

export async function sumExpensesForRange(
  from: string,
  to: string,
  status?: EntryStatus
): Promise<string> {
  const result = await db
    .select({ total: sum(expenseEntries.amount) })
    .from(expenseEntries)
    .where(
      and(
        gte(expenseEntries.date, from),
        lte(expenseEntries.date, to),
        expenseStatusFilter(status, eq(expenseEntries.status, 'paga'))
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

export async function getIncomeByCampaignForRange(
  from: string,
  to: string
): Promise<IncomeByCampaignRow[]> {
  const rows = await db
    .select({
      campaignId: campaigns.id,
      campaignName: campaigns.name,
      total: sum(incomeEntries.amount)
    })
    .from(incomeEntries)
    .innerJoin(campaigns, eq(incomeEntries.campaignId, campaigns.id))
    .where(
      and(
        gte(incomeEntries.referenceDate, from),
        lte(incomeEntries.referenceDate, to),
        eq(incomeEntries.status, 'paga'),
        isNotNull(incomeEntries.campaignId)
      )
    )
    .groupBy(campaigns.id, campaigns.name);

  return rows.map((r) => ({
    campaignId: r.campaignId,
    campaignName: r.campaignName,
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
        gte(expenseEntries.date, from),
        lte(expenseEntries.date, to),
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

export async function getAllIncomeReportRows(from: string, to: string): Promise<IncomeReportRow[]> {
  const rows = await db
    .select({
      id: incomeEntries.id,
      referenceDate: incomeEntries.referenceDate,
      depositDate: incomeEntries.depositDate,
      amount: incomeEntries.amount,
      categoryId: incomeCategories.id,
      categoryName: incomeCategories.name,
      parentCategoryId: parentIncomeCat.id,
      parentCategoryName: parentIncomeCat.name,
      campaignId: campaigns.id,
      campaignName: campaigns.name,
      attenderId: attenders.id,
      attenderName: attenders.name,
      paymentMethodName: paymentMethods.name,
      notes: incomeEntries.notes,
      status: incomeEntries.status
    })
    .from(incomeEntries)
    .innerJoin(incomeCategories, eq(incomeEntries.categoryId, incomeCategories.id))
    .leftJoin(parentIncomeCat, eq(incomeCategories.parentId, parentIncomeCat.id))
    .leftJoin(campaigns, eq(incomeEntries.campaignId, campaigns.id))
    .leftJoin(attenders, eq(incomeEntries.attenderId, attenders.id))
    .innerJoin(paymentMethods, eq(incomeEntries.paymentMethodId, paymentMethods.id))
    .where(
      and(
        gte(incomeEntries.referenceDate, from),
        lte(incomeEntries.referenceDate, to),
        ne(incomeEntries.status, 'cancelada')
      )
    )
    .orderBy(
      sql`COALESCE(${incomeEntries.depositDate}, ${incomeEntries.referenceDate}) DESC`,
      desc(incomeEntries.id)
    );

  return rows.map((r) => ({
    id: r.id,
    referenceDate: r.referenceDate,
    depositDate: r.depositDate,
    amount: r.amount,
    categoryId: r.categoryId,
    categoryName: r.categoryName,
    parentCategoryId: r.parentCategoryId ?? null,
    parentCategoryName: r.parentCategoryName ?? null,
    campaignId: r.campaignId ?? null,
    campaignName: r.campaignName ?? null,
    attenderId: r.attenderId ?? null,
    attenderName: r.attenderName ?? null,
    paymentMethodName: r.paymentMethodName,
    notes: r.notes ?? null,
    status: r.status as 'pendente' | 'paga'
  }));
}

export async function getAllExpenseReportRows(
  from: string,
  to: string
): Promise<ExpenseReportRow[]> {
  const rows = await db
    .select({
      id: expenseEntries.id,
      date: expenseEntries.date,
      categoryId: expenseCategories.id,
      categoryName: expenseCategories.name,
      parentCategoryId: parentExpenseCat.id,
      parentCategoryName: parentExpenseCat.name,
      campaignId: campaigns.id,
      campaignName: campaigns.name,
      attenderId: attenders.id,
      attenderName: attenders.name,
      paymentMethodName: paymentMethods.name,
      installment: expenseEntries.installment,
      totalInstallments: expenseEntries.totalInstallments,
      receipt: expenseEntries.receipt,
      notes: expenseEntries.notes,
      amount: expenseEntries.amount,
      status: expenseEntries.status
    })
    .from(expenseEntries)
    .innerJoin(expenseCategories, eq(expenseEntries.categoryId, expenseCategories.id))
    .leftJoin(parentExpenseCat, eq(expenseCategories.parentId, parentExpenseCat.id))
    .leftJoin(campaigns, eq(expenseEntries.campaignId, campaigns.id))
    .leftJoin(attenders, eq(expenseEntries.attenderId, attenders.id))
    .innerJoin(paymentMethods, eq(expenseEntries.paymentMethodId, paymentMethods.id))
    .where(
      and(
        gte(expenseEntries.date, from),
        lte(expenseEntries.date, to),
        ne(expenseEntries.status, 'cancelada')
      )
    )
    .orderBy(asc(expenseEntries.date));

  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    categoryId: r.categoryId,
    categoryName: r.categoryName,
    parentCategoryId: r.parentCategoryId ?? null,
    parentCategoryName: r.parentCategoryName ?? null,
    campaignId: r.campaignId ?? null,
    campaignName: r.campaignName ?? null,
    attenderId: r.attenderId ?? null,
    attenderName: r.attenderName ?? null,
    paymentMethodName: r.paymentMethodName,
    installment: r.installment,
    totalInstallments: r.totalInstallments,
    hasReceipt: r.receipt !== null,
    notes: r.notes ?? null,
    amount: r.amount,
    status: r.status as 'pendente' | 'paga'
  }));
}

export async function countActiveAttenders(): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(attenders)
    .where(eq(attenders.status, 'ativo'));
  return result[0]?.count ?? 0;
}

export async function countDistinctAttendersWithTithe(
  from: string,
  to: string,
  titheIds: number[]
): Promise<number> {
  if (titheIds.length === 0) return 0;
  const result = await db
    .selectDistinct({ attenderId: incomeEntries.attenderId })
    .from(incomeEntries)
    .where(
      and(
        gte(incomeEntries.referenceDate, from),
        lte(incomeEntries.referenceDate, to),
        eq(incomeEntries.status, 'paga'),
        inArray(incomeEntries.categoryId, titheIds),
        isNotNull(incomeEntries.attenderId)
      )
    );
  return result.length;
}

export async function countDistinctAttendersWithOfferings(
  from: string,
  to: string,
  offeringIds: number[]
): Promise<number> {
  if (offeringIds.length === 0) return 0;
  const result = await db
    .selectDistinct({ attenderId: incomeEntries.attenderId })
    .from(incomeEntries)
    .where(
      and(
        gte(incomeEntries.referenceDate, from),
        lte(incomeEntries.referenceDate, to),
        eq(incomeEntries.status, 'paga'),
        inArray(incomeEntries.categoryId, offeringIds),
        isNotNull(incomeEntries.attenderId)
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

export async function findAllActiveCampaigns() {
  const today = new Date().toISOString().slice(0, 10);
  return db
    .select()
    .from(campaigns)
    .where(
      and(
        notDeleted(campaigns),
        eq(campaigns.status, CampaignStatus.Active),
        or(isNull(campaigns.targetDate), gte(campaigns.targetDate, today))
      )
    );
}

export async function findCampaignById(id: number) {
  const result = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  return result[0] ?? null;
}

export async function sumAllTimeIncomePerCampaign(): Promise<Map<number, string>> {
  const rows = await db
    .select({ campaignId: incomeEntries.campaignId, total: sum(incomeEntries.amount) })
    .from(incomeEntries)
    .where(and(eq(incomeEntries.status, 'paga'), isNotNull(incomeEntries.campaignId)))
    .groupBy(incomeEntries.campaignId);

  const map = new Map<number, string>();
  for (const r of rows) {
    if (r.campaignId !== null) map.set(r.campaignId, r.total ?? '0.00');
  }
  return map;
}

export async function sumAllTimeExpensesPerCampaign(): Promise<Map<number, string>> {
  const rows = await db
    .select({ campaignId: expenseEntries.campaignId, total: sum(expenseEntries.amount) })
    .from(expenseEntries)
    .where(and(eq(expenseEntries.status, 'paga'), isNotNull(expenseEntries.campaignId)))
    .groupBy(expenseEntries.campaignId);

  const map = new Map<number, string>();
  for (const r of rows) {
    if (r.campaignId !== null) map.set(r.campaignId, r.total ?? '0.00');
  }
  return map;
}

export async function sumAllTimeIncomeForCampaign(campaignId: number): Promise<string> {
  const result = await db
    .select({ total: sum(incomeEntries.amount) })
    .from(incomeEntries)
    .where(and(eq(incomeEntries.status, 'paga'), eq(incomeEntries.campaignId, campaignId)));
  return result[0]?.total ?? '0.00';
}

export async function sumAllTimeExpensesForCampaign(campaignId: number): Promise<string> {
  const result = await db
    .select({ total: sum(expenseEntries.amount) })
    .from(expenseEntries)
    .where(and(eq(expenseEntries.status, 'paga'), eq(expenseEntries.campaignId, campaignId)));
  return result[0]?.total ?? '0.00';
}

export async function sumIncomePerCampaignForRange(
  from: string,
  to: string
): Promise<Map<number, string>> {
  const rows = await db
    .select({ campaignId: incomeEntries.campaignId, total: sum(incomeEntries.amount) })
    .from(incomeEntries)
    .where(
      and(
        gte(incomeEntries.referenceDate, from),
        lte(incomeEntries.referenceDate, to),
        eq(incomeEntries.status, 'paga'),
        isNotNull(incomeEntries.campaignId)
      )
    )
    .groupBy(incomeEntries.campaignId);

  const map = new Map<number, string>();
  for (const r of rows) {
    if (r.campaignId !== null) map.set(r.campaignId, r.total ?? '0.00');
  }
  return map;
}

export async function sumExpensesPerCampaignForRange(
  from: string,
  to: string
): Promise<Map<number, string>> {
  const rows = await db
    .select({ campaignId: expenseEntries.campaignId, total: sum(expenseEntries.amount) })
    .from(expenseEntries)
    .where(
      and(
        gte(expenseEntries.date, from),
        lte(expenseEntries.date, to),
        eq(expenseEntries.status, 'paga'),
        isNotNull(expenseEntries.campaignId)
      )
    )
    .groupBy(expenseEntries.campaignId);

  const map = new Map<number, string>();
  for (const r of rows) {
    if (r.campaignId !== null) map.set(r.campaignId, r.total ?? '0.00');
  }
  return map;
}

export async function getCampaignIncomeEntries(campaignId: number): Promise<CampaignIncomeEntry[]> {
  const rows = await db
    .select({
      id: incomeEntries.id,
      referenceDate: incomeEntries.referenceDate,
      amount: incomeEntries.amount,
      categoryName: incomeCategories.name,
      attenderName: attenders.name,
      notes: incomeEntries.notes
    })
    .from(incomeEntries)
    .innerJoin(incomeCategories, eq(incomeEntries.categoryId, incomeCategories.id))
    .leftJoin(attenders, eq(incomeEntries.attenderId, attenders.id))
    .where(and(eq(incomeEntries.campaignId, campaignId), eq(incomeEntries.status, 'paga')))
    .orderBy(asc(incomeEntries.referenceDate));

  return rows.map((r) => ({
    id: r.id,
    referenceDate: r.referenceDate,
    amount: r.amount,
    categoryName: r.categoryName,
    attenderName: r.attenderName ?? null,
    notes: r.notes ?? null
  }));
}

export async function getCampaignExpenseEntries(
  campaignId: number
): Promise<CampaignExpenseEntry[]> {
  const rows = await db
    .select({
      id: expenseEntries.id,
      date: expenseEntries.date,
      amount: expenseEntries.amount,
      categoryName: expenseCategories.name,
      notes: expenseEntries.notes
    })
    .from(expenseEntries)
    .innerJoin(expenseCategories, eq(expenseEntries.categoryId, expenseCategories.id))
    .where(and(eq(expenseEntries.campaignId, campaignId), eq(expenseEntries.status, 'paga')))
    .orderBy(asc(expenseEntries.date));

  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    amount: r.amount,
    categoryName: r.categoryName,
    notes: r.notes ?? null
  }));
}

export async function getCampaignIncomeEntriesForRange(
  campaignId: number,
  from: string,
  to: string
): Promise<CampaignIncomeEntry[]> {
  const rows = await db
    .select({
      id: incomeEntries.id,
      referenceDate: incomeEntries.referenceDate,
      amount: incomeEntries.amount,
      categoryName: incomeCategories.name,
      attenderName: attenders.name,
      notes: incomeEntries.notes
    })
    .from(incomeEntries)
    .innerJoin(incomeCategories, eq(incomeEntries.categoryId, incomeCategories.id))
    .leftJoin(attenders, eq(incomeEntries.attenderId, attenders.id))
    .where(
      and(
        eq(incomeEntries.campaignId, campaignId),
        gte(incomeEntries.referenceDate, from),
        lte(incomeEntries.referenceDate, to),
        eq(incomeEntries.status, 'paga')
      )
    )
    .orderBy(asc(incomeEntries.referenceDate));

  return rows.map((r) => ({
    id: r.id,
    referenceDate: r.referenceDate,
    amount: r.amount,
    categoryName: r.categoryName,
    attenderName: r.attenderName ?? null,
    notes: r.notes ?? null
  }));
}

export async function getCampaignExpenseEntriesForRange(
  campaignId: number,
  from: string,
  to: string
): Promise<CampaignExpenseEntry[]> {
  const rows = await db
    .select({
      id: expenseEntries.id,
      date: expenseEntries.date,
      amount: expenseEntries.amount,
      categoryName: expenseCategories.name,
      notes: expenseEntries.notes
    })
    .from(expenseEntries)
    .innerJoin(expenseCategories, eq(expenseEntries.categoryId, expenseCategories.id))
    .where(
      and(
        eq(expenseEntries.campaignId, campaignId),
        gte(expenseEntries.date, from),
        lte(expenseEntries.date, to),
        eq(expenseEntries.status, 'paga')
      )
    )
    .orderBy(asc(expenseEntries.date));

  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    amount: r.amount,
    categoryName: r.categoryName,
    notes: r.notes ?? null
  }));
}

export async function sumIncomeForCampaignRange(
  campaignId: number,
  from: string,
  to: string
): Promise<string> {
  const result = await db
    .select({ total: sum(incomeEntries.amount) })
    .from(incomeEntries)
    .where(
      and(
        eq(incomeEntries.campaignId, campaignId),
        gte(incomeEntries.referenceDate, from),
        lte(incomeEntries.referenceDate, to),
        eq(incomeEntries.status, 'paga')
      )
    );
  return result[0]?.total ?? '0.00';
}

export async function sumExpensesForCampaignRange(
  campaignId: number,
  from: string,
  to: string
): Promise<string> {
  const result = await db
    .select({ total: sum(expenseEntries.amount) })
    .from(expenseEntries)
    .where(
      and(
        eq(expenseEntries.campaignId, campaignId),
        gte(expenseEntries.date, from),
        lte(expenseEntries.date, to),
        eq(expenseEntries.status, 'paga')
      )
    );
  return result[0]?.total ?? '0.00';
}

// ---------------------------------------------------------------------------
// Event report helpers — mirror the campaign helpers above, but keyed on event_id.
// ---------------------------------------------------------------------------

export async function findAllActiveEvents() {
  return db.select().from(events).where(eq(events.status, 'ativo'));
}

export async function findEventByIdForReport(id: number) {
  const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return result[0] ?? null;
}

export async function sumAllTimeIncomePerEvent(): Promise<Map<number, string>> {
  const rows = await db
    .select({ eventId: incomeEntries.eventId, total: sum(incomeEntries.amount) })
    .from(incomeEntries)
    .where(and(eq(incomeEntries.status, 'paga'), isNotNull(incomeEntries.eventId)))
    .groupBy(incomeEntries.eventId);

  const map = new Map<number, string>();
  for (const r of rows) {
    if (r.eventId !== null) map.set(r.eventId, r.total ?? '0.00');
  }
  return map;
}

export async function sumAllTimeExpensesPerEvent(): Promise<Map<number, string>> {
  const rows = await db
    .select({ eventId: expenseEntries.eventId, total: sum(expenseEntries.amount) })
    .from(expenseEntries)
    .where(and(eq(expenseEntries.status, 'paga'), isNotNull(expenseEntries.eventId)))
    .groupBy(expenseEntries.eventId);

  const map = new Map<number, string>();
  for (const r of rows) {
    if (r.eventId !== null) map.set(r.eventId, r.total ?? '0.00');
  }
  return map;
}

export async function sumIncomePerEventForRange(
  from: string,
  to: string
): Promise<Map<number, string>> {
  const rows = await db
    .select({ eventId: incomeEntries.eventId, total: sum(incomeEntries.amount) })
    .from(incomeEntries)
    .where(
      and(
        gte(incomeEntries.referenceDate, from),
        lte(incomeEntries.referenceDate, to),
        eq(incomeEntries.status, 'paga'),
        isNotNull(incomeEntries.eventId)
      )
    )
    .groupBy(incomeEntries.eventId);

  const map = new Map<number, string>();
  for (const r of rows) {
    if (r.eventId !== null) map.set(r.eventId, r.total ?? '0.00');
  }
  return map;
}

export async function sumExpensesPerEventForRange(
  from: string,
  to: string
): Promise<Map<number, string>> {
  const rows = await db
    .select({ eventId: expenseEntries.eventId, total: sum(expenseEntries.amount) })
    .from(expenseEntries)
    .where(
      and(
        gte(expenseEntries.date, from),
        lte(expenseEntries.date, to),
        eq(expenseEntries.status, 'paga'),
        isNotNull(expenseEntries.eventId)
      )
    )
    .groupBy(expenseEntries.eventId);

  const map = new Map<number, string>();
  for (const r of rows) {
    if (r.eventId !== null) map.set(r.eventId, r.total ?? '0.00');
  }
  return map;
}

export async function sumAllTimeIncomeForEvent(eventId: number): Promise<string> {
  const result = await db
    .select({ total: sum(incomeEntries.amount) })
    .from(incomeEntries)
    .where(and(eq(incomeEntries.status, 'paga'), eq(incomeEntries.eventId, eventId)));
  return result[0]?.total ?? '0.00';
}

export async function sumAllTimeExpensesForEvent(eventId: number): Promise<string> {
  const result = await db
    .select({ total: sum(expenseEntries.amount) })
    .from(expenseEntries)
    .where(and(eq(expenseEntries.status, 'paga'), eq(expenseEntries.eventId, eventId)));
  return result[0]?.total ?? '0.00';
}

export async function sumIncomeForEventRange(
  eventId: number,
  from: string,
  to: string
): Promise<string> {
  const result = await db
    .select({ total: sum(incomeEntries.amount) })
    .from(incomeEntries)
    .where(
      and(
        eq(incomeEntries.eventId, eventId),
        gte(incomeEntries.referenceDate, from),
        lte(incomeEntries.referenceDate, to),
        eq(incomeEntries.status, 'paga')
      )
    );
  return result[0]?.total ?? '0.00';
}

export async function sumExpensesForEventRange(
  eventId: number,
  from: string,
  to: string
): Promise<string> {
  const result = await db
    .select({ total: sum(expenseEntries.amount) })
    .from(expenseEntries)
    .where(
      and(
        eq(expenseEntries.eventId, eventId),
        gte(expenseEntries.date, from),
        lte(expenseEntries.date, to),
        eq(expenseEntries.status, 'paga')
      )
    );
  return result[0]?.total ?? '0.00';
}

export async function getEventIncomeEntries(eventId: number): Promise<EventIncomeEntry[]> {
  const rows = await db
    .select({
      id: incomeEntries.id,
      referenceDate: incomeEntries.referenceDate,
      amount: incomeEntries.amount,
      categoryName: incomeCategories.name,
      attenderName: attenders.name,
      notes: incomeEntries.notes
    })
    .from(incomeEntries)
    .innerJoin(incomeCategories, eq(incomeEntries.categoryId, incomeCategories.id))
    .leftJoin(attenders, eq(incomeEntries.attenderId, attenders.id))
    .where(and(eq(incomeEntries.eventId, eventId), eq(incomeEntries.status, 'paga')))
    .orderBy(asc(incomeEntries.referenceDate));

  return rows.map((r) => ({
    id: r.id,
    referenceDate: r.referenceDate,
    amount: r.amount,
    categoryName: r.categoryName,
    attenderName: r.attenderName ?? null,
    notes: r.notes ?? null
  }));
}

export async function getEventExpenseEntries(eventId: number): Promise<EventExpenseEntry[]> {
  const rows = await db
    .select({
      id: expenseEntries.id,
      date: expenseEntries.date,
      amount: expenseEntries.amount,
      categoryName: expenseCategories.name,
      notes: expenseEntries.notes
    })
    .from(expenseEntries)
    .innerJoin(expenseCategories, eq(expenseEntries.categoryId, expenseCategories.id))
    .where(and(eq(expenseEntries.eventId, eventId), eq(expenseEntries.status, 'paga')))
    .orderBy(asc(expenseEntries.date));

  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    amount: r.amount,
    categoryName: r.categoryName,
    notes: r.notes ?? null
  }));
}

export async function getEventIncomeEntriesForRange(
  eventId: number,
  from: string,
  to: string
): Promise<EventIncomeEntry[]> {
  const rows = await db
    .select({
      id: incomeEntries.id,
      referenceDate: incomeEntries.referenceDate,
      amount: incomeEntries.amount,
      categoryName: incomeCategories.name,
      attenderName: attenders.name,
      notes: incomeEntries.notes
    })
    .from(incomeEntries)
    .innerJoin(incomeCategories, eq(incomeEntries.categoryId, incomeCategories.id))
    .leftJoin(attenders, eq(incomeEntries.attenderId, attenders.id))
    .where(
      and(
        eq(incomeEntries.eventId, eventId),
        gte(incomeEntries.referenceDate, from),
        lte(incomeEntries.referenceDate, to),
        eq(incomeEntries.status, 'paga')
      )
    )
    .orderBy(asc(incomeEntries.referenceDate));

  return rows.map((r) => ({
    id: r.id,
    referenceDate: r.referenceDate,
    amount: r.amount,
    categoryName: r.categoryName,
    attenderName: r.attenderName ?? null,
    notes: r.notes ?? null
  }));
}

export async function getEventExpenseEntriesForRange(
  eventId: number,
  from: string,
  to: string
): Promise<EventExpenseEntry[]> {
  const rows = await db
    .select({
      id: expenseEntries.id,
      date: expenseEntries.date,
      amount: expenseEntries.amount,
      categoryName: expenseCategories.name,
      notes: expenseEntries.notes
    })
    .from(expenseEntries)
    .innerJoin(expenseCategories, eq(expenseEntries.categoryId, expenseCategories.id))
    .where(
      and(
        eq(expenseEntries.eventId, eventId),
        gte(expenseEntries.date, from),
        lte(expenseEntries.date, to),
        eq(expenseEntries.status, 'paga')
      )
    )
    .orderBy(asc(expenseEntries.date));

  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    amount: r.amount,
    categoryName: r.categoryName,
    notes: r.notes ?? null
  }));
}

export async function getIncomeAggregatesForRange(
  from: string,
  to: string
): Promise<IncomeAggregateRow[]> {
  const rows = await db
    .select({
      referenceDate: incomeEntries.referenceDate,
      categoryId: incomeCategories.id,
      categoryName: incomeCategories.name,
      parentCategoryId: parentIncomeCat.id,
      parentCategoryName: parentIncomeCat.name,
      campaignId: campaigns.id,
      campaignName: campaigns.name,
      total: sum(incomeEntries.amount)
    })
    .from(incomeEntries)
    .innerJoin(incomeCategories, eq(incomeEntries.categoryId, incomeCategories.id))
    .leftJoin(parentIncomeCat, eq(incomeCategories.parentId, parentIncomeCat.id))
    .leftJoin(campaigns, eq(incomeEntries.campaignId, campaigns.id))
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
      campaigns.id,
      campaigns.name
    )
    .orderBy(asc(incomeEntries.referenceDate));

  return rows.map((r) => ({
    referenceDate: r.referenceDate,
    categoryId: r.categoryId,
    categoryName: r.categoryName,
    parentCategoryId: r.parentCategoryId,
    parentCategoryName: r.parentCategoryName,
    campaignId: r.campaignId,
    campaignName: r.campaignName,
    total: r.total ?? '0.00'
  }));
}

export async function countIncomeByCategories(
  from: string,
  to: string,
  categoryNames: string[]
): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(incomeEntries)
    .innerJoin(incomeCategories, eq(incomeEntries.categoryId, incomeCategories.id))
    .where(
      and(
        gte(incomeEntries.referenceDate, from),
        lte(incomeEntries.referenceDate, to),
        eq(incomeEntries.status, 'paga'),
        inArray(incomeCategories.name, categoryNames)
      )
    );
  return result[0]?.count ?? 0;
}
