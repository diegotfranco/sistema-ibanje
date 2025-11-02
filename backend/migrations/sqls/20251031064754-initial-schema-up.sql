-- =============================
-- CUSTOM TYPES (ENUMS)
-- =============================

-- Generic status for most tables (active/inactive)
CREATE TYPE active_status AS ENUM ('ativo', 'inativo', 'pendente');

-- Status for the lifecycle of financial transactions
CREATE TYPE transaction_status AS ENUM ('pendente', 'paga', 'cancelada');

-- Types for meetings and minutes
CREATE TYPE meeting_type AS ENUM ('ordinária', 'extraordinária');
CREATE TYPE minute_version_status AS ENUM ('aguardando aprovação', 'aprovada', 'substituída');

-- =============================
-- HELPER FUNCTION
-- =============================

-- Function to automatically update 'updated_at' timestamps.
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =============================
-- TABLE: roles
-- =============================
CREATE TABLE roles (
  id serial PRIMARY KEY,
  name varchar(64) UNIQUE NOT NULL,
  description varchar(256),
  status active_status NOT NULL DEFAULT 'ativo',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- =============================
-- TABLE: modules
-- =============================
CREATE TABLE modules (
  id serial PRIMARY KEY,
  name varchar(64) UNIQUE NOT NULL,
  description varchar(256),
  status active_status NOT NULL DEFAULT 'ativo',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- =============================
-- TABLE: permissions
-- =============================
CREATE TABLE permissions (
  id serial PRIMARY KEY,
  name varchar(64) UNIQUE NOT NULL,
  description varchar(256),
  status active_status NOT NULL DEFAULT 'ativo',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- =============================
-- TABLE: users
-- =============================
CREATE TABLE users (
  id serial PRIMARY KEY,
  name varchar(96) NOT NULL,
  email varchar(96) UNIQUE NOT NULL,
  password_hash text,
  role_id int REFERENCES roles(id),
  status active_status NOT NULL DEFAULT 'ativo',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- =============================
-- TABLE: user_module_permissions
-- =============================
CREATE TABLE user_module_permissions (
  user_id int REFERENCES users(id) ON DELETE CASCADE,
  module_id int REFERENCES modules(id) ON DELETE CASCADE,
  permission_id int REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, module_id, permission_id)
);

-- =============================
-- TABLE: role_module_permissions
-- =============================
CREATE TABLE role_module_permissions (
  role_id int REFERENCES roles(id) ON DELETE CASCADE,
  module_id int REFERENCES modules(id) ON DELETE CASCADE,
  permission_id int REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, module_id, permission_id)
);

-- =============================
-- TABLE: members
-- =============================
CREATE TABLE members (
  id serial PRIMARY KEY,
  name varchar(96) NOT NULL,
  birth_date date,
  address_street varchar(96),
  address_number int,
  address_complement varchar(64),
  address_district varchar(64),
  state char(2),
  city varchar(96),
  postal_code char(8),
  email varchar(96),
  phone varchar(16),
  status active_status NOT NULL DEFAULT 'ativo',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- =============================
-- TABLE: fund_balances
-- =============================
CREATE TABLE fund_balances (
  id serial PRIMARY KEY,
  reference_date date UNIQUE,
  available_balance numeric(12,2),
  savings_balance numeric(12,2),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- =============================
-- TABLE: payment_methods
-- =============================
CREATE TABLE payment_methods (
  id serial PRIMARY KEY,
  name varchar(64) UNIQUE NOT NULL,
  allows_inflow boolean DEFAULT false NOT NULL,
  allows_outflow boolean DEFAULT false NOT NULL,
  status active_status NOT NULL DEFAULT 'ativo',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT chk_at_least_one_flow CHECK (allows_inflow = true OR allows_outflow = true)
);

-- =============================
-- TABLE: income_categories
-- =============================
CREATE TABLE income_categories (
  id serial PRIMARY KEY,
  name varchar(64) UNIQUE NOT NULL,
  status active_status NOT NULL DEFAULT 'ativo',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- =============================
-- TABLE: income_entries
-- =============================
CREATE TABLE income_entries (
  id serial PRIMARY KEY,
  reference_date date,
  deposit_date date,
  amount numeric(12,2),
  category_id int NOT NULL REFERENCES income_categories(id),
  member_id int REFERENCES members(id),
  payment_method_id int NOT NULL REFERENCES payment_methods(id),
  status transaction_status NOT NULL DEFAULT 'pendente',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT chk_amount_positive CHECK (amount > 0)
);

-- =============================
-- TABLE: expense_categories
-- =============================
CREATE TABLE expense_categories (
  id serial PRIMARY KEY,
  name varchar(64) UNIQUE NOT NULL,
  status active_status NOT NULL DEFAULT 'ativo',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- =============================
-- TABLE: expense_entries
-- =============================
CREATE TABLE expense_entries (
  id serial PRIMARY KEY,
  reference_date date,
  total numeric(12,2),
  amount numeric(12,2),
  installment int DEFAULT 1,
  total_installments int DEFAULT 1,
  category_id int NOT NULL REFERENCES expense_categories(id),
  user_id int NOT NULL REFERENCES users(id),
  payment_method_id int NOT NULL REFERENCES payment_methods(id),
  receipt uuid,
  status transaction_status NOT NULL DEFAULT 'pendente',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT chk_amount_positive CHECK (amount > 0),
  CONSTRAINT chk_total_positive CHECK (total >= 0),
  CONSTRAINT chk_installments_valid CHECK (installment > 0 AND total_installments > 0 AND installment <= total_installments)
);

COMMENT ON COLUMN expense_entries.receipt IS 'The UUID of the receipt object stored in MinIO.';

-- =============================
-- TABLE: password_reset_tokens
-- =============================
CREATE TABLE password_reset_tokens (
  id serial PRIMARY KEY,
  user_id int REFERENCES users(id) ON DELETE CASCADE,
  email varchar(320) NOT NULL,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  ip_address varchar(45),
  user_agent text
);

-- =============================
-- TABLE: board_meetings
-- =============================
CREATE TABLE board_meetings (
  id serial PRIMARY KEY,
  meeting_date date NOT NULL,
  type meeting_type NOT NULL,
  agenda_content JSONB,
  agenda_author_id int REFERENCES users(id),
  agenda_created_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON COLUMN board_meetings.agenda_content IS 'The agenda content, stored as a QuillJS Delta in JSONB format.';

-- =============================
-- TABLE: minutes
-- =============================
CREATE TABLE minutes (
  id serial PRIMARY KEY,
  board_meeting_id int NOT NULL UNIQUE REFERENCES board_meetings(id),
  minute_number varchar(32) NOT NULL UNIQUE,
  is_notarized boolean DEFAULT false NOT NULL,
  notarized_at timestamptz,
  corrects_minute_id int REFERENCES minutes(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE minutes IS 'The master record for a meeting minute. Contains static info and points to the meeting it belongs to.';
COMMENT ON COLUMN minutes.corrects_minute_id IS 'If this minute is a correction, this points to the minute ID it corrects.';


-- =============================
-- TABLE: minute_versions
-- =============================
CREATE TABLE minute_versions (
  id serial PRIMARY KEY,
  minute_id int NOT NULL REFERENCES minutes(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  version int NOT NULL,
  status minute_version_status NOT NULL DEFAULT 'aguardando aprovação',
  reason_for_change varchar(512),
  created_by_user_id int NOT NULL REFERENCES users(id),
  approved_at_meeting_id int REFERENCES board_meetings(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (minute_id, version)
);

COMMENT ON TABLE minute_versions IS 'Stores the version history (snapshots) of the content for each minute.';
COMMENT ON COLUMN minute_versions.content IS 'The actual minute text, stored as a QuillJS Delta in JSONB format.';
COMMENT ON COLUMN minute_versions.status IS 'The workflow state of the version: pending_approval, approved, or superseded.';
COMMENT ON COLUMN minute_versions.approved_at_meeting_id IS 'A reference to the meeting where this specific version was approved.';


-- =============================
-- INDEXES
-- =============================

-- Indexes for password reset functionality
CREATE INDEX idx_password_reset_tokens_email_created_at ON password_reset_tokens (email, created_at DESC);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens (expires_at);
CREATE INDEX idx_password_reset_tokens_unused ON password_reset_tokens (token_hash) WHERE used_at IS NULL;

-- Indexes on Foreign Keys for performance
CREATE INDEX idx_users_role_id ON users (role_id);
CREATE INDEX idx_income_entries_category_id ON income_entries (category_id);
CREATE INDEX idx_income_entries_member_id ON income_entries (member_id);
CREATE INDEX idx_income_entries_payment_method_id ON income_entries (payment_method_id);
CREATE INDEX idx_expense_entries_category_id ON expense_entries (category_id);
CREATE INDEX idx_expense_entries_user_id ON expense_entries (user_id);
CREATE INDEX idx_expense_entries_payment_method_id ON expense_entries (payment_method_id);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens (user_id);
CREATE INDEX idx_minutes_board_meeting_id ON minutes (board_meeting_id);
CREATE INDEX idx_minute_versions_minute_id ON minute_versions (minute_id);

-- Indexes on new ENUM status columns for efficient filtering
CREATE INDEX idx_roles_status ON roles (status);
CREATE INDEX idx_modules_status ON modules (status);
CREATE INDEX idx_permissions_status ON permissions (status);
CREATE INDEX idx_users_status ON users (status);
CREATE INDEX idx_members_status ON members (status);
CREATE INDEX idx_payment_methods_status ON payment_methods (status);
CREATE INDEX idx_income_categories_status ON income_categories (status);
CREATE INDEX idx_income_entries_status ON income_entries (status);
CREATE INDEX idx_expense_categories_status ON expense_categories (status);
CREATE INDEX idx_expense_entries_status ON expense_entries (status);
CREATE INDEX idx_minute_versions_status ON minute_versions (status);