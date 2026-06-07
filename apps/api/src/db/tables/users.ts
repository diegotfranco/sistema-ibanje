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
  primaryKey,
  uniqueIndex,
  char,
  check
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { activeStatus, attenderStatus, admissionMode } from './enums.js';

export const roles = pgTable(
  'roles',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 64 }).notNull(),
    description: varchar('description', { length: 256 }),
    status: activeStatus('status').default('ativo').notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    // Partial unique: a soft-deleted role must not block re-creating a role with the same name.
    uniqueIndex('uq_roles_name_active')
      .on(table.name)
      .where(sql`${table.deletedAt} IS NULL`),
    index('roles_deleted_at_idx').on(table.deletedAt)
  ]
);

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

export const users = pgTable(
  'users',
  {
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
  },
  (table) => [
    index('users_role_id_idx').on(table.roleId),
    index('users_status_idx').on(table.status)
  ]
);

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

export const attenders = pgTable(
  'attenders',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
    isMember: boolean('is_member').default(false).notNull(),
    // Month-granular values are stored DB-wide as a single YYYYMM integer (e.g. 202404).
    memberSince: integer('member_since'),
    congregatingSince: integer('congregating_since'),
    admissionMode: admissionMode('admission_mode'),
    name: varchar('name', { length: 96 }).notNull(),
    birthDate: date('birth_date'),
    baptismDate: date('baptism_date'),
    addressStreet: varchar('address_street', { length: 96 }),
    addressNumber: varchar('address_number', { length: 16 }),
    addressComplement: varchar('address_complement', { length: 64 }),
    addressDistrict: varchar('address_district', { length: 64 }),
    state: char('state', { length: 2 }),
    city: varchar('city', { length: 96 }),
    postalCode: char('postal_code', { length: 8 }),
    email: varchar('email', { length: 96 }),
    phone: varchar('phone', { length: 16 }),
    status: attenderStatus('status').default('ativo').notNull(),
    // Exit metadata, set when status moves to a formal-exit state (desligado/transferido/falecido);
    // cleared on reactivation. `exitLetterId` is a soft reference to a `carta_de_transferência`
    // membership letter — app-validated, not a DB FK, to avoid an attenders↔membership_letters
    // schema import cycle (the letter is often issued weeks after the transfer).
    exitDate: date('exit_date'),
    exitReason: varchar('exit_reason', { length: 256 }),
    exitLetterId: integer('exit_letter_id'),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('attenders_status_idx').on(table.status),
    index('attenders_deleted_at_idx').on(table.deletedAt),
    // Partial unique: a soft-deleted attender must not block re-linking that user to a new attender.
    uniqueIndex('uq_attenders_user_id_active')
      .on(table.userId)
      .where(sql`${table.deletedAt} IS NULL`),
    check(
      'chk_member_since_yyyymm',
      sql`${table.memberSince} IS NULL OR (${table.memberSince} BETWEEN 190001 AND 999912 AND ${table.memberSince} % 100 BETWEEN 1 AND 12)`
    ),
    check(
      'chk_congregating_since_yyyymm',
      sql`${table.congregatingSince} IS NULL OR (${table.congregatingSince} BETWEEN 190001 AND 999912 AND ${table.congregatingSince} % 100 BETWEEN 1 AND 12)`
    )
  ]
);

export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 320 }).notNull(),
    tokenHash: text('token_hash').unique().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent')
  },
  (table) => [
    index('password_reset_tokens_user_id_idx').on(table.userId),
    index('password_reset_tokens_expires_at_idx').on(table.expiresAt)
  ]
);

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type Module = typeof modules.$inferSelect;
export type NewModule = typeof modules.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Attender = typeof attenders.$inferSelect;
export type NewAttender = typeof attenders.$inferInsert;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;
