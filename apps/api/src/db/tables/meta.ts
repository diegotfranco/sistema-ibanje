import {
  pgTable,
  serial,
  integer,
  varchar,
  char,
  text,
  timestamp,
  check,
  index
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';

export const churchSettings = pgTable(
  'church_settings',
  {
    id: integer('id').primaryKey().default(1),
    name: varchar('name', { length: 128 }).notNull(),
    cnpj: varchar('cnpj', { length: 14 }).notNull(),
    addressStreet: varchar('address_street', { length: 128 }).notNull(),
    addressNumber: varchar('address_number', { length: 16 }).notNull(),
    addressDistrict: varchar('address_district', { length: 64 }).notNull(),
    addressCity: varchar('address_city', { length: 64 }).notNull(),
    addressState: char('address_state', { length: 2 }).notNull(),
    postalCode: char('postal_code', { length: 8 }).notNull(),
    phone: varchar('phone', { length: 11 }),
    email: varchar('email', { length: 96 }),
    websiteUrl: varchar('website_url', { length: 128 }),
    logoPath: text('logo_path'),
    currentPresidentName: varchar('current_president_name', { length: 96 }),
    currentPresidentTitle: varchar('current_president_title', { length: 48 }).default('Presidente'),
    currentSecretaryName: varchar('current_secretary_name', { length: 96 }),
    currentSecretaryTitle: varchar('current_secretary_title', { length: 48 }).default(
      '1º Secretário(a)'
    ),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [check('chk_church_settings_singleton', sql`${table.id} = 1`)]
);

export const auditLog = pgTable(
  'audit_log',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: integer('entity_id'),
    notes: text('notes'),
    ipAddress: text('ip_address'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('audit_log_user_id_idx').on(table.userId),
    index('audit_log_entity_idx').on(table.entityType, table.entityId),
    index('audit_log_created_at_idx').on(table.createdAt)
  ]
);

export type ChurchSettings = typeof churchSettings.$inferSelect;
export type NewChurchSettings = typeof churchSettings.$inferInsert;
export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;
