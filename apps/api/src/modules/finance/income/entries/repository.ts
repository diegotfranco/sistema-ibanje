import { eq, count, desc, and, gte, lte, sum, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '../../../../db/index.js';
import {
  incomeEntries,
  incomeCategories,
  attenders,
  paymentMethods,
  campaigns,
  events
} from '../../../../db/schema.js';

const parentIncomeCategories = alias(incomeCategories, 'parent_income_categories');

const selectFields = {
  id: incomeEntries.id,
  depositDate: incomeEntries.depositDate,
  referenceDate: incomeEntries.referenceDate,
  attributionMonth: incomeEntries.attributionMonth,
  amount: incomeEntries.amount,
  categoryId: incomeEntries.categoryId,
  categoryName: incomeCategories.name,
  parentCategoryId: parentIncomeCategories.id,
  parentCategoryName: parentIncomeCategories.name,
  attenderId: incomeEntries.attenderId,
  attenderName: attenders.name,
  paymentMethodId: incomeEntries.paymentMethodId,
  paymentMethodName: paymentMethods.name,
  campaignId: incomeEntries.campaignId,
  campaignName: campaigns.name,
  eventId: incomeEntries.eventId,
  eventName: events.title,
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
    .leftJoin(parentIncomeCategories, eq(parentIncomeCategories.id, incomeCategories.parentId))
    .innerJoin(paymentMethods, eq(incomeEntries.paymentMethodId, paymentMethods.id))
    .leftJoin(attenders, eq(incomeEntries.attenderId, attenders.id))
    .leftJoin(campaigns, eq(incomeEntries.campaignId, campaigns.id))
    .leftJoin(events, eq(incomeEntries.eventId, events.id));
}

export async function listIncomeEntries(offset: number, limit: number) {
  const rows = await baseQuery()
    .orderBy(desc(incomeEntries.depositDate), desc(incomeEntries.id))
    .offset(offset)
    .limit(limit);

  const countResult = await db.select({ count: count() }).from(incomeEntries);
  return { rows, total: countResult[0]?.count ?? 0 };
}

// The period a donation belongs to is `attributionMonth` (a YYYYMM int) when set, else
// derived from `referenceDate` (a full date) as a YYYYMM int — so both sides are comparable.
const donationPeriod = sql<number>`coalesce(${incomeEntries.attributionMonth}, extract(year from ${incomeEntries.referenceDate})::int * 100 + extract(month from ${incomeEntries.referenceDate})::int)`;
// `YYYY-MM` string from the YYYYMM int period.
const donationMonthKey = sql<string>`(${donationPeriod} / 100)::text || '-' || lpad((${donationPeriod} % 100)::text, 2, '0')`;
// `YYYY` string from the YYYYMM int period.
const donationYearKey = sql<string>`(${donationPeriod} / 100)::text`;

// Confirmed-only ('paga') donations for one attender in a given year, aggregated in SQL
// per (month, leaf category, campaign, event). Totals stay exact numeric — never summed as
// JS floats — matching how the reports module aggregates money. Grouping is by the
// leaf category (`income_categories.name`), not the parent: a printable giving
// statement should show what was actually given (Dízimo, Oferta, Doação) rather
// than collapsing everything under "Contribuições".
export async function aggregateConfirmedDonationsByAttender(attenderId: number, year: number) {
  return db
    .select({
      month: donationMonthKey,
      categoryName: incomeCategories.name,
      campaignName: campaigns.name,
      eventName: events.title,
      total: sum(incomeEntries.amount)
    })
    .from(incomeEntries)
    .innerJoin(incomeCategories, eq(incomeEntries.categoryId, incomeCategories.id))
    .leftJoin(campaigns, eq(incomeEntries.campaignId, campaigns.id))
    .leftJoin(events, eq(incomeEntries.eventId, events.id))
    .where(
      and(
        eq(incomeEntries.attenderId, attenderId),
        eq(incomeEntries.status, 'paga'),
        eq(donationYearKey, String(year))
      )
    )
    .groupBy(donationMonthKey, incomeCategories.name, campaigns.name, events.title)
    .orderBy(donationMonthKey, incomeCategories.name);
}

// Distinct years (desc) in which an attender has confirmed donations — drives the
// statement's year picker so it only offers years that actually have giving.
export async function listDonationYearsByAttender(attenderId: number): Promise<number[]> {
  const rows = await db
    .selectDistinct({ year: donationYearKey })
    .from(incomeEntries)
    .where(and(eq(incomeEntries.attenderId, attenderId), eq(incomeEntries.status, 'paga')))
    .orderBy(desc(donationYearKey));

  return rows.map((r) => parseInt(r.year, 10));
}

// Per-transaction confirmed donations for one attender in a given month (YYYY-MM),
// ordered by deposit date. Powers the statement's month drill-down — the receipt-style
// detail the aggregate above intentionally collapses.
export async function listConfirmedDonationEntriesByAttenderMonth(
  attenderId: number,
  month: string
) {
  return db
    .select({
      id: incomeEntries.id,
      depositDate: incomeEntries.depositDate,
      categoryName: incomeCategories.name,
      campaignName: campaigns.name,
      eventName: events.title,
      paymentMethodName: paymentMethods.name,
      amount: incomeEntries.amount
    })
    .from(incomeEntries)
    .innerJoin(incomeCategories, eq(incomeEntries.categoryId, incomeCategories.id))
    .innerJoin(paymentMethods, eq(incomeEntries.paymentMethodId, paymentMethods.id))
    .leftJoin(campaigns, eq(incomeEntries.campaignId, campaigns.id))
    .leftJoin(events, eq(incomeEntries.eventId, events.id))
    .where(
      and(
        eq(incomeEntries.attenderId, attenderId),
        eq(incomeEntries.status, 'paga'),
        eq(donationMonthKey, month)
      )
    )
    .orderBy(incomeEntries.depositDate, incomeEntries.id);
}

export async function findIncomeEntryById(id: number) {
  const result = await baseQuery().where(eq(incomeEntries.id, id)).limit(1);

  return result[0] ?? null;
}

export async function insertIncomeEntry(data: {
  depositDate: string;
  referenceDate: string;
  attributionMonth?: number;
  amount: number;
  categoryId: number;
  attenderId?: number;
  paymentMethodId: number;
  campaignId?: number;
  eventId?: number;
  notes?: string;
  userId: number;
  status?: 'pendente' | 'paga' | 'cancelada';
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
      | 'depositDate'
      | 'referenceDate'
      | 'attributionMonth'
      | 'amount'
      | 'categoryId'
      | 'attenderId'
      | 'paymentMethodId'
      | 'campaignId'
      | 'eventId'
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

export async function summarizeIncomeByTopLevelCategory(
  from: string,
  to: string
): Promise<{ categoryId: number; categoryName: string; total: string }[]> {
  const parentCategories = alias(incomeCategories, 'parent_income_categories');

  const rows = await db
    .select({
      categoryId: sql<number>`coalesce(${incomeCategories.parentId}, ${incomeCategories.id})`,
      categoryName: sql<string>`coalesce(${parentCategories.name}, ${incomeCategories.name})`,
      total: sum(incomeEntries.amount).mapWith(String)
    })
    .from(incomeEntries)
    .innerJoin(incomeCategories, eq(incomeEntries.categoryId, incomeCategories.id))
    .leftJoin(parentCategories, eq(parentCategories.id, incomeCategories.parentId))
    .where(
      and(
        eq(incomeEntries.status, 'paga'),
        gte(incomeEntries.referenceDate, from),
        lte(incomeEntries.referenceDate, to)
      )
    )
    .groupBy(
      sql`coalesce(${incomeCategories.parentId}, ${incomeCategories.id})`,
      sql`coalesce(${parentCategories.name}, ${incomeCategories.name})`
    )
    .orderBy(sql`coalesce(${parentCategories.name}, ${incomeCategories.name})`);

  return rows;
}
