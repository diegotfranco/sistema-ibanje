import {
  pgTable,
  serial,
  varchar,
  boolean,
  char,
  date,
  integer,
  text,
  jsonb,
  timestamp,
  unique,
  index,
  time,
  AnyPgColumn
} from 'drizzle-orm/pg-core';
import { meetingType, minuteVersionStatus, membershipLetterType } from './enums.js';
import { users } from './users.js';
import { attenders } from './users.js';
import { meetings } from './meetings.js';

export const minutes = pgTable('minutes', {
  id: serial('id').primaryKey(),
  meetingId: integer('meeting_id')
    .unique()
    .notNull()
    .references(() => meetings.id),
  minuteNumber: varchar('minute_number', { length: 32 }).unique().notNull(),
  isNotarized: boolean('is_notarized').default(false).notNull(),
  notarizedAt: timestamp('notarized_at', { withTimezone: true }),
  correctsMinuteId: integer('corrects_minute_id').references((): AnyPgColumn => minutes.id),
  presidingPastorName: varchar('presiding_pastor_name', { length: 96 }),
  secretaryName: varchar('secretary_name', { length: 96 }),
  openingTime: time('opening_time'),
  closingTime: time('closing_time'),
  signedDocumentPath: text('signed_document_path'),
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
    approvedAtMeetingId: integer('approved_at_meeting_id').references(() => meetings.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    unique('uq_minute_version').on(table.minuteId, table.version),
    index('minute_versions_minute_id_idx').on(table.minuteId)
  ]
);

export const minuteTemplates = pgTable(
  'minute_templates',
  {
    id: serial('id').primaryKey(),
    meetingType: meetingType('meeting_type').notNull(),
    name: varchar('name', { length: 128 }).notNull(),
    content: jsonb('content').notNull(),
    isDefault: boolean('is_default').default(false).notNull(),
    defaultAgendaItems: jsonb('default_agenda_items')
      .$type<Array<{ title: string; description?: string | null }>>()
      .default([])
      .notNull(),
    createdByUserId: integer('created_by_user_id').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    unique('uq_default_template_per_type').on(table.meetingType, table.isDefault),
    index('minute_templates_meeting_type_idx').on(table.meetingType)
  ]
);

export const membershipLetters = pgTable(
  'membership_letters',
  {
    id: serial('id').primaryKey(),
    attenderId: integer('attender_id')
      .notNull()
      .references(() => attenders.id),
    type: membershipLetterType('type').notNull(),
    letterDate: date('letter_date').notNull(),
    otherChurchName: varchar('other_church_name', { length: 128 }).notNull(),
    otherChurchAddress: varchar('other_church_address', { length: 256 }),
    otherChurchCity: varchar('other_church_city', { length: 96 }).notNull(),
    otherChurchState: char('other_church_state', { length: 2 }),
    signingSecretaryName: varchar('signing_secretary_name', { length: 96 }).notNull(),
    signingSecretaryTitle: varchar('signing_secretary_title', { length: 48 }).notNull(),
    signingPresidentName: varchar('signing_president_name', { length: 96 }).notNull(),
    signingPresidentTitle: varchar('signing_president_title', { length: 48 }).notNull(),
    additionalContext: text('additional_context'),
    createdByUserId: integer('created_by_user_id')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('membership_letters_attender_id_idx').on(table.attenderId),
    index('membership_letters_type_idx').on(table.type)
  ]
);

export type Minute = typeof minutes.$inferSelect;
export type NewMinute = typeof minutes.$inferInsert;
export type MinuteVersion = typeof minuteVersions.$inferSelect;
export type NewMinuteVersion = typeof minuteVersions.$inferInsert;
export type MinuteTemplate = typeof minuteTemplates.$inferSelect;
export type NewMinuteTemplate = typeof minuteTemplates.$inferInsert;
export type MembershipLetter = typeof membershipLetters.$inferSelect;
export type NewMembershipLetter = typeof membershipLetters.$inferInsert;
