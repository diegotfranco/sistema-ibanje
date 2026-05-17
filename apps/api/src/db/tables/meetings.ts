import {
  pgTable,
  serial,
  varchar,
  boolean,
  date,
  integer,
  text,
  timestamp,
  check,
  index,
  primaryKey
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { activeStatus, meetingType, eventType, recurrenceType } from './enums.js';
import { users } from './users.js';
import { attenders } from './users.js';

export const meetings = pgTable(
  'meetings',
  {
    id: serial('id').primaryKey(),
    meetingDate: date('meeting_date').notNull(),
    type: meetingType('type').notNull(),
    isPublic: boolean('is_public').default(false).notNull(),
    status: activeStatus('status').default('ativo').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('meetings_meeting_date_idx').on(table.meetingDate),
    index('meetings_status_idx').on(table.status)
  ]
);

export const agendaItems = pgTable(
  'agenda_items',
  {
    id: serial('id').primaryKey(),
    meetingId: integer('meeting_id')
      .notNull()
      .references(() => meetings.id, { onDelete: 'cascade' }),
    order: integer('order').notNull(),
    title: varchar('title', { length: 256 }).notNull(),
    description: text('description'),
    createdByUserId: integer('created_by_user_id').references(() => users.id),
    status: activeStatus('status').default('ativo').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [index('agenda_items_meeting_id_idx').on(table.meetingId)]
);

export const meetingAttendersPresent = pgTable(
  'meeting_attenders_present',
  {
    meetingId: integer('meeting_id')
      .notNull()
      .references(() => meetings.id, { onDelete: 'cascade' }),
    attenderId: integer('attender_id')
      .notNull()
      .references(() => attenders.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    primaryKey({ columns: [table.meetingId, table.attenderId] }),
    index('map_meeting_id_idx').on(table.meetingId)
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

export type Meeting = typeof meetings.$inferSelect;
export type NewMeeting = typeof meetings.$inferInsert;
export type AgendaItem = typeof agendaItems.$inferSelect;
export type NewAgendaItem = typeof agendaItems.$inferInsert;
export type MeetingAttenderPresent = typeof meetingAttendersPresent.$inferSelect;
export type NewMeetingAttenderPresent = typeof meetingAttendersPresent.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
