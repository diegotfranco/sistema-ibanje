import { pgTable, serial, varchar, text, timestamp, check, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { activeStatus } from './enums.js';

export const events = pgTable(
  'events',
  {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 128 }).notNull(),
    description: text('description'),
    location: varchar('location', { length: 128 }),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    status: activeStatus('status').default('ativo').notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    check('chk_event_end_after_start', sql`${table.endTime} > ${table.startTime}`),
    index('events_start_time_idx').on(table.startTime),
    index('events_status_idx').on(table.status),
    index('events_deleted_at_idx').on(table.deletedAt)
  ]
);

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
