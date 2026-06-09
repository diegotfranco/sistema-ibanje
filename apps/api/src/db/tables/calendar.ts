import { pgTable, serial, varchar, text, date, timestamp, index } from 'drizzle-orm/pg-core';
import { activeStatus } from './enums.js';

// Dates the secretary wants to track (holidays, reminders). Distinct from `events`, which are
// timed, finance-linked activities. Schema-only for now — the CRUD module, frontend, and the
// dashboard reminders that merge these with derived attender birth/baptism dates are follow-ups.
export const calendarEntries = pgTable(
  'calendar_entries',
  {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 128 }).notNull(),
    date: date('date').notNull(),
    notes: text('notes'),
    status: activeStatus('status').default('ativo').notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('calendar_entries_date_idx').on(table.date),
    index('calendar_entries_status_idx').on(table.status),
    index('calendar_entries_deleted_at_idx').on(table.deletedAt)
  ]
);

export type CalendarEntry = typeof calendarEntries.$inferSelect;
export type NewCalendarEntry = typeof calendarEntries.$inferInsert;
