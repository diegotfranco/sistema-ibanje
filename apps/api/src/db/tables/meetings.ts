import {
  pgTable,
  serial,
  varchar,
  boolean,
  date,
  integer,
  text,
  timestamp,
  index,
  primaryKey
} from 'drizzle-orm/pg-core';
import { activeStatus, meetingType } from './enums.js';
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

export type Meeting = typeof meetings.$inferSelect;
export type NewMeeting = typeof meetings.$inferInsert;
export type AgendaItem = typeof agendaItems.$inferSelect;
export type NewAgendaItem = typeof agendaItems.$inferInsert;
export type MeetingAttenderPresent = typeof meetingAttendersPresent.$inferSelect;
export type NewMeetingAttenderPresent = typeof meetingAttendersPresent.$inferInsert;
