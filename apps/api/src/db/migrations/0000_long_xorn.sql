CREATE TYPE "public"."active_status" AS ENUM('ativo', 'inativo', 'pendente');--> statement-breakpoint
CREATE TYPE "public"."closing_status" AS ENUM('aberto', 'em revisão', 'rejeitado', 'aprovado', 'fechado');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('culto', 'reunião', 'evento especial', 'outro');--> statement-breakpoint
CREATE TYPE "public"."meeting_type" AS ENUM('ordinária', 'extraordinária');--> statement-breakpoint
CREATE TYPE "public"."minute_version_status" AS ENUM('aguardando aprovação', 'aprovada', 'substituída');--> statement-breakpoint
CREATE TYPE "public"."recurrence_type" AS ENUM('nenhuma', 'semanal', 'quinzenal', 'mensal');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pendente', 'paga', 'cancelada');--> statement-breakpoint
CREATE TABLE "board_meetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"meeting_date" date NOT NULL,
	"type" "meeting_type" NOT NULL,
	"agenda_content" jsonb,
	"agenda_author_id" integer,
	"agenda_created_at" timestamp with time zone,
	"is_public" boolean DEFAULT false NOT NULL,
	"status" "active_status" DEFAULT 'ativo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "designated_funds" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(96) NOT NULL,
	"description" text,
	"target_amount" numeric(12, 2),
	"target_date" date,
	"status" "active_status" DEFAULT 'ativo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(128) NOT NULL,
	"description" text,
	"location" varchar(128),
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"type" "event_type" DEFAULT 'culto' NOT NULL,
	"recurrence" "recurrence_type" DEFAULT 'nenhuma' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_by_user_id" integer,
	"status" "active_status" DEFAULT 'ativo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_event_end_after_start" CHECK ("events"."end_time" > "events"."start_time")
);
--> statement-breakpoint
CREATE TABLE "expense_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"name" varchar(64) NOT NULL,
	"description" varchar(256),
	"status" "active_status" DEFAULT 'ativo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"reference_date" date NOT NULL,
	"description" varchar(256) NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"installment" integer DEFAULT 1 NOT NULL,
	"total_installments" integer DEFAULT 1 NOT NULL,
	"category_id" integer NOT NULL,
	"member_id" integer,
	"payment_method_id" integer NOT NULL,
	"designated_fund_id" integer,
	"receipt" text,
	"notes" text,
	"user_id" integer NOT NULL,
	"status" "transaction_status" DEFAULT 'pendente' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_expense_amount_positive" CHECK ("expense_entries"."amount" > 0),
	CONSTRAINT "chk_expense_total_positive" CHECK ("expense_entries"."total" >= 0),
	CONSTRAINT "chk_expense_installments_valid" CHECK ("expense_entries"."installment" > 0 AND "expense_entries"."total_installments" > 0 AND "expense_entries"."installment" <= "expense_entries"."total_installments")
);
--> statement-breakpoint
CREATE TABLE "finance_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"opening_balance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_finance_settings_singleton" CHECK ("finance_settings"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "income_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"name" varchar(64) NOT NULL,
	"description" varchar(256),
	"requires_member" boolean DEFAULT false NOT NULL,
	"status" "active_status" DEFAULT 'ativo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "income_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference_date" date NOT NULL,
	"deposit_date" date,
	"amount" numeric(12, 2) NOT NULL,
	"category_id" integer NOT NULL,
	"member_id" integer,
	"payment_method_id" integer NOT NULL,
	"designated_fund_id" integer,
	"notes" text,
	"user_id" integer NOT NULL,
	"status" "transaction_status" DEFAULT 'pendente' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_income_amount_positive" CHECK ("income_entries"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"name" varchar(96) NOT NULL,
	"birth_date" date,
	"address_street" varchar(96),
	"address_number" integer,
	"address_complement" varchar(64),
	"address_district" varchar(64),
	"state" char(2),
	"city" varchar(96),
	"postal_code" char(8),
	"email" varchar(96),
	"phone" varchar(16),
	"status" "active_status" DEFAULT 'ativo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "members_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "minute_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"minute_id" integer NOT NULL,
	"content" jsonb NOT NULL,
	"version" integer NOT NULL,
	"status" "minute_version_status" DEFAULT 'aguardando aprovação' NOT NULL,
	"reason_for_change" varchar(512),
	"created_by_user_id" integer NOT NULL,
	"approved_at_meeting_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_minute_version" UNIQUE("minute_id","version")
);
--> statement-breakpoint
CREATE TABLE "minutes" (
	"id" serial PRIMARY KEY NOT NULL,
	"board_meeting_id" integer NOT NULL,
	"minute_number" varchar(32) NOT NULL,
	"is_notarized" boolean DEFAULT false NOT NULL,
	"notarized_at" timestamp with time zone,
	"corrects_minute_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "minutes_board_meeting_id_unique" UNIQUE("board_meeting_id"),
	CONSTRAINT "minutes_minute_number_unique" UNIQUE("minute_number")
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(64) NOT NULL,
	"description" varchar(256),
	"status" "active_status" DEFAULT 'ativo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "modules_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "monthly_closings" (
	"id" serial PRIMARY KEY NOT NULL,
	"period_year" integer NOT NULL,
	"period_month" integer NOT NULL,
	"closing_balance" numeric(12, 2),
	"treasurer_notes" text,
	"accountant_notes" text,
	"status" "closing_status" DEFAULT 'aberto' NOT NULL,
	"submitted_by_user_id" integer,
	"submitted_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"closed_by_user_id" integer,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_monthly_closing_period" UNIQUE("period_year","period_month"),
	CONSTRAINT "chk_period_month_valid" CHECK ("monthly_closings"."period_month" BETWEEN 1 AND 12)
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"email" varchar(320) NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"ip_address" varchar(45),
	"user_agent" text,
	CONSTRAINT "password_reset_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(64) NOT NULL,
	"allows_inflow" boolean DEFAULT false NOT NULL,
	"allows_outflow" boolean DEFAULT false NOT NULL,
	"status" "active_status" DEFAULT 'ativo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_methods_name_unique" UNIQUE("name"),
	CONSTRAINT "chk_at_least_one_flow" CHECK ("payment_methods"."allows_inflow" = true OR "payment_methods"."allows_outflow" = true)
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(64) NOT NULL,
	"description" varchar(256),
	"status" "active_status" DEFAULT 'ativo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "role_module_permissions" (
	"role_id" integer NOT NULL,
	"module_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	CONSTRAINT "role_module_permissions_role_id_module_id_permission_id_pk" PRIMARY KEY("role_id","module_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(64) NOT NULL,
	"description" varchar(256),
	"status" "active_status" DEFAULT 'ativo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_module_permissions" (
	"user_id" integer NOT NULL,
	"module_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	CONSTRAINT "user_module_permissions_user_id_module_id_permission_id_pk" PRIMARY KEY("user_id","module_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(96) NOT NULL,
	"email" varchar(96) NOT NULL,
	"password_hash" text,
	"role_id" integer NOT NULL,
	"status" "active_status" DEFAULT 'ativo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "board_meetings" ADD CONSTRAINT "board_meetings_agenda_author_id_users_id_fk" FOREIGN KEY ("agenda_author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_parent_id_expense_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."expense_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_entries" ADD CONSTRAINT "expense_entries_parent_id_expense_entries_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."expense_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_entries" ADD CONSTRAINT "expense_entries_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_entries" ADD CONSTRAINT "expense_entries_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_entries" ADD CONSTRAINT "expense_entries_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_entries" ADD CONSTRAINT "expense_entries_designated_fund_id_designated_funds_id_fk" FOREIGN KEY ("designated_fund_id") REFERENCES "public"."designated_funds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_entries" ADD CONSTRAINT "expense_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_categories" ADD CONSTRAINT "income_categories_parent_id_income_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."income_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_entries" ADD CONSTRAINT "income_entries_category_id_income_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."income_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_entries" ADD CONSTRAINT "income_entries_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_entries" ADD CONSTRAINT "income_entries_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_entries" ADD CONSTRAINT "income_entries_designated_fund_id_designated_funds_id_fk" FOREIGN KEY ("designated_fund_id") REFERENCES "public"."designated_funds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_entries" ADD CONSTRAINT "income_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "minute_versions" ADD CONSTRAINT "minute_versions_minute_id_minutes_id_fk" FOREIGN KEY ("minute_id") REFERENCES "public"."minutes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "minute_versions" ADD CONSTRAINT "minute_versions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "minute_versions" ADD CONSTRAINT "minute_versions_approved_at_meeting_id_board_meetings_id_fk" FOREIGN KEY ("approved_at_meeting_id") REFERENCES "public"."board_meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "minutes" ADD CONSTRAINT "minutes_board_meeting_id_board_meetings_id_fk" FOREIGN KEY ("board_meeting_id") REFERENCES "public"."board_meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "minutes" ADD CONSTRAINT "minutes_corrects_minute_id_minutes_id_fk" FOREIGN KEY ("corrects_minute_id") REFERENCES "public"."minutes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_closings" ADD CONSTRAINT "monthly_closings_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_closings" ADD CONSTRAINT "monthly_closings_closed_by_user_id_users_id_fk" FOREIGN KEY ("closed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_module_permissions" ADD CONSTRAINT "role_module_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_module_permissions" ADD CONSTRAINT "role_module_permissions_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_module_permissions" ADD CONSTRAINT "role_module_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_module_permissions" ADD CONSTRAINT "user_module_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_module_permissions" ADD CONSTRAINT "user_module_permissions_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_module_permissions" ADD CONSTRAINT "user_module_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;