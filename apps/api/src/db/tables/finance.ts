import {
  pgTable,
  serial,
  varchar,
  boolean,
  date,
  integer,
  numeric,
  text,
  timestamp,
  check,
  AnyPgColumn,
  index,
  unique
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { activeStatus, transactionStatus, closingStatus } from './enums.js';
import { users } from './users.js';
import { attenders } from './users.js';

export const paymentMethods = pgTable(
  'payment_methods',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 64 }).unique().notNull(),
    allowsInflow: boolean('allows_inflow').default(false).notNull(),
    allowsOutflow: boolean('allows_outflow').default(false).notNull(),
    status: activeStatus('status').default('ativo').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    check(
      'chk_at_least_one_flow',
      sql`${table.allowsInflow} = true OR ${table.allowsOutflow} = true`
    )
  ]
);

export const designatedFunds = pgTable('designated_funds', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 96 }).notNull(),
  description: text('description'),
  targetAmount: numeric('target_amount', { precision: 12, scale: 2 }),
  targetDate: date('target_date'),
  status: activeStatus('status').default('ativo').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const incomeCategories = pgTable('income_categories', {
  id: serial('id').primaryKey(),
  parentId: integer('parent_id').references((): AnyPgColumn => incomeCategories.id),
  name: varchar('name', { length: 64 }).notNull(),
  description: varchar('description', { length: 256 }),
  requiresMember: boolean('requires_member').default(false).notNull(),
  status: activeStatus('status').default('ativo').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const incomeEntries = pgTable(
  'income_entries',
  {
    id: serial('id').primaryKey(),
    depositDate: date('deposit_date').notNull(),
    referenceDate: date('reference_date').notNull(),
    attributionMonth: date('attribution_month'),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => incomeCategories.id),
    attenderId: integer('attender_id').references(() => attenders.id),
    paymentMethodId: integer('payment_method_id')
      .notNull()
      .references(() => paymentMethods.id),
    designatedFundId: integer('designated_fund_id').references(() => designatedFunds.id),
    notes: text('notes'),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    status: transactionStatus('status').default('pendente').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    check('chk_income_amount_positive', sql`${table.amount} > 0`),
    index('income_entries_deposit_date_idx').on(table.depositDate),
    index('income_entries_reference_date_idx').on(table.referenceDate),
    index('income_entries_status_idx').on(table.status),
    index('income_entries_category_id_idx').on(table.categoryId),
    index('income_entries_attender_id_idx').on(table.attenderId),
    index('income_entries_payment_method_id_idx').on(table.paymentMethodId),
    index('income_entries_designated_fund_id_idx').on(table.designatedFundId)
  ]
);

export const expenseCategories = pgTable('expense_categories', {
  id: serial('id').primaryKey(),
  parentId: integer('parent_id').references((): AnyPgColumn => expenseCategories.id),
  name: varchar('name', { length: 64 }).notNull(),
  description: varchar('description', { length: 256 }),
  status: activeStatus('status').default('ativo').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const expenseEntries = pgTable(
  'expense_entries',
  {
    id: serial('id').primaryKey(),
    parentId: integer('parent_id').references((): AnyPgColumn => expenseEntries.id),
    date: date('date').notNull(),
    total: numeric('total', { precision: 12, scale: 2 }).notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    installment: integer('installment').default(1).notNull(),
    totalInstallments: integer('total_installments').default(1).notNull(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => expenseCategories.id),
    attenderId: integer('attender_id').references(() => attenders.id),
    paymentMethodId: integer('payment_method_id')
      .notNull()
      .references(() => paymentMethods.id),
    designatedFundId: integer('designated_fund_id').references(() => designatedFunds.id),
    receipt: text('receipt'),
    notes: text('notes'),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    status: transactionStatus('status').default('pendente').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    check('chk_expense_amount_positive', sql`${table.amount} > 0`),
    check('chk_expense_total_positive', sql`${table.total} >= 0`),
    check(
      'chk_expense_installments_valid',
      sql`${table.installment} > 0 AND ${table.totalInstallments} > 0 AND ${table.installment} <= ${table.totalInstallments}`
    ),
    index('expense_entries_date_idx').on(table.date),
    index('expense_entries_status_idx').on(table.status),
    index('expense_entries_category_id_idx').on(table.categoryId),
    index('expense_entries_attender_id_idx').on(table.attenderId),
    index('expense_entries_payment_method_id_idx').on(table.paymentMethodId),
    index('expense_entries_designated_fund_id_idx').on(table.designatedFundId),
    index('expense_entries_parent_id_idx').on(table.parentId)
  ]
);

export const financeSettings = pgTable(
  'finance_settings',
  {
    id: integer('id').primaryKey().default(1),
    openingBalance: numeric('opening_balance', { precision: 12, scale: 2 }).default('0').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [check('chk_finance_settings_singleton', sql`${table.id} = 1`)]
);

export const monthlyClosings = pgTable(
  'monthly_closings',
  {
    id: serial('id').primaryKey(),
    periodYear: integer('period_year').notNull(),
    periodMonth: integer('period_month').notNull(),
    closingBalance: numeric('closing_balance', { precision: 12, scale: 2 }),
    treasurerNotes: text('treasurer_notes'),
    accountantNotes: text('accountant_notes'),
    status: closingStatus('status').default('aberto').notNull(),
    submittedByUserId: integer('submitted_by_user_id').references(() => users.id),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    closedByUserId: integer('closed_by_user_id').references(() => users.id),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    check('chk_period_month_valid', sql`${table.periodMonth} BETWEEN 1 AND 12`),
    unique('uq_monthly_closing_period').on(table.periodYear, table.periodMonth),
    index('monthly_closings_status_idx').on(table.status)
  ]
);

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type NewPaymentMethod = typeof paymentMethods.$inferInsert;
export type DesignatedFund = typeof designatedFunds.$inferSelect;
export type NewDesignatedFund = typeof designatedFunds.$inferInsert;
export type IncomeCategory = typeof incomeCategories.$inferSelect;
export type NewIncomeCategory = typeof incomeCategories.$inferInsert;
export type IncomeEntry = typeof incomeEntries.$inferSelect;
export type NewIncomeEntry = typeof incomeEntries.$inferInsert;
export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type NewExpenseCategory = typeof expenseCategories.$inferInsert;
export type ExpenseEntry = typeof expenseEntries.$inferSelect;
export type NewExpenseEntry = typeof expenseEntries.$inferInsert;
export type FinanceSettings = typeof financeSettings.$inferSelect;
export type NewFinanceSettings = typeof financeSettings.$inferInsert;
export type MonthlyClosing = typeof monthlyClosings.$inferSelect;
export type NewMonthlyClosing = typeof monthlyClosings.$inferInsert;
