import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  boolean,
  date,
  integer,
  numeric,
  text,
  jsonb,
  char,
  timestamp,
  check,
  primaryKey,
  AnyPgColumn,
  unique
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const activeStatus = pgEnum('active_status', ['ativo', 'inativo', 'pendente']);
export const transactionStatus = pgEnum('transaction_status', ['pendente', 'paga', 'cancelada']);
export const meetingType = pgEnum('meeting_type', ['ordinária', 'extraordinária']);
export const minuteVersionStatus = pgEnum('minute_version_status', [
  'aguardando aprovação',
  'aprovada',
  'substituída'
]);
export const eventType = pgEnum('event_type', ['culto', 'reunião', 'evento especial', 'outro']);
export const recurrenceType = pgEnum('recurrence_type', [
  'nenhuma',
  'semanal',
  'quinzenal',
  'mensal'
]);
export const closingStatus = pgEnum('closing_status', [
  'aberto',
  'em revisão',
  'rejeitado',
  'aprovado',
  'fechado'
]);

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 64 }).unique().notNull(),
  description: varchar('description', { length: 256 }),
  status: activeStatus('status').default('ativo').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const modules = pgTable('modules', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 64 }).unique().notNull(),
  description: varchar('description', { length: 256 }),
  status: activeStatus('status').default('ativo').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 64 }).unique().notNull(),
  description: varchar('description', { length: 256 }),
  status: activeStatus('status').default('ativo').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 96 }).notNull(),
  email: varchar('email', { length: 96 }).unique().notNull(),
  passwordHash: text('password_hash'),
  roleId: integer('role_id')
    .references(() => roles.id)
    .notNull(),
  status: activeStatus('status').default('ativo').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const roleModulePermissions = pgTable(
  'role_module_permissions',
  {
    roleId: integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    moduleId: integer('module_id')
      .notNull()
      .references(() => modules.id, { onDelete: 'cascade' }),
    permissionId: integer('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' })
  },
  (table) => [primaryKey({ columns: [table.roleId, table.moduleId, table.permissionId] })]
);

export const userModulePermissions = pgTable(
  'user_module_permissions',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    moduleId: integer('module_id')
      .notNull()
      .references(() => modules.id, { onDelete: 'cascade' }),
    permissionId: integer('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' })
  },
  (table) => [primaryKey({ columns: [table.userId, table.moduleId, table.permissionId] })]
);

export const members = pgTable('members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .unique()
    .references(() => users.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 96 }).notNull(),
  birthDate: date('birth_date'),
  addressStreet: varchar('address_street', { length: 96 }),
  addressNumber: integer('address_number'),
  addressComplement: varchar('address_complement', { length: 64 }),
  addressDistrict: varchar('address_district', { length: 64 }),
  state: char('state', { length: 2 }),
  city: varchar('city', { length: 96 }),
  postalCode: char('postal_code', { length: 8 }),
  email: varchar('email', { length: 96 }),
  phone: varchar('phone', { length: 16 }),
  status: activeStatus('status').default('ativo').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

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
    referenceDate: date('reference_date').notNull(),
    depositDate: date('deposit_date'),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => incomeCategories.id),
    memberId: integer('member_id').references(() => members.id),
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
  (table) => [check('chk_income_amount_positive', sql`${table.amount} > 0`)]
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
    referenceDate: date('reference_date').notNull(),
    description: varchar('description', { length: 256 }).notNull(),
    total: numeric('total', { precision: 12, scale: 2 }).notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    installment: integer('installment').default(1).notNull(),
    totalInstallments: integer('total_installments').default(1).notNull(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => expenseCategories.id),
    memberId: integer('member_id').references(() => members.id),
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
    )
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
    unique('uq_monthly_closing_period').on(table.periodYear, table.periodMonth)
  ]
);

export const events = pgTable(
  'events',
  {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 128 }).notNull(),
    description: text('description'),
    location: varchar('location', { length: 128 }),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    type: eventType('type').default('culto').notNull(),
    recurrence: recurrenceType('recurrence').default('nenhuma').notNull(),
    isPublic: boolean('is_public').default(false).notNull(),
    createdByUserId: integer('created_by_user_id').references(() => users.id),
    status: activeStatus('status').default('ativo').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [check('chk_event_end_after_start', sql`${table.endTime} > ${table.startTime}`)]
);

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 320 }).notNull(),
  tokenHash: text('token_hash').unique().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent')
});

export const boardMeetings = pgTable('board_meetings', {
  id: serial('id').primaryKey(),
  meetingDate: date('meeting_date').notNull(),
  type: meetingType('type').notNull(),
  agendaContent: jsonb('agenda_content'),
  agendaAuthorId: integer('agenda_author_id').references(() => users.id),
  agendaCreatedAt: timestamp('agenda_created_at', { withTimezone: true }),
  isPublic: boolean('is_public').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const minutes = pgTable('minutes', {
  id: serial('id').primaryKey(),
  boardMeetingId: integer('board_meeting_id')
    .unique()
    .notNull()
    .references(() => boardMeetings.id),
  minuteNumber: varchar('minute_number', { length: 32 }).unique().notNull(),
  isNotarized: boolean('is_notarized').default(false).notNull(),
  notarizedAt: timestamp('notarized_at', { withTimezone: true }),
  correctsMinuteId: integer('corrects_minute_id').references((): AnyPgColumn => minutes.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const minuteVersions = pgTable(
  'minute_versions',
  {
    id: serial('id').primaryKey(),
    minuteId: integer('minute_id')
      .notNull()
      .references(() => minutes.id, { onDelete: 'cascade' }),
    content: jsonb('content').notNull(),
    version: integer('version').notNull(),
    status: minuteVersionStatus('status').default('aguardando aprovação').notNull(),
    reasonForChange: varchar('reason_for_change', { length: 512 }),
    createdByUserId: integer('created_by_user_id')
      .notNull()
      .references(() => users.id),
    approvedAtMeetingId: integer('approved_at_meeting_id').references(() => boardMeetings.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [unique('uq_minute_version').on(table.minuteId, table.version)]
);

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type Module = typeof modules.$inferSelect;
export type NewModule = typeof modules.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
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
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type BoardMeeting = typeof boardMeetings.$inferSelect;
export type NewBoardMeeting = typeof boardMeetings.$inferInsert;
export type Minute = typeof minutes.$inferSelect;
export type NewMinute = typeof minutes.$inferInsert;
export type MinuteVersion = typeof minuteVersions.$inferSelect;
export type NewMinuteVersion = typeof minuteVersions.$inferInsert;
