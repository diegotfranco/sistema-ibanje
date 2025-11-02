-- =============================
-- DROP ALL TABLES
-- =============================
-- The CASCADE option will automatically drop dependent objects,
-- including foreign key constraints and indexes.
DROP TABLE IF EXISTS minute_versions CASCADE;
DROP TABLE IF EXISTS minutes CASCADE;
DROP TABLE IF EXISTS board_meetings CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS expense_entries CASCADE;
DROP TABLE IF EXISTS expense_categories CASCADE;
DROP TABLE IF EXISTS income_entries CASCADE;
DROP TABLE IF EXISTS income_categories CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS fund_balances CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS role_module_permissions CASCADE;
DROP TABLE IF EXISTS user_module_permissions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- =============================
-- DROP HELPER FUNCTION
-- =============================
DROP FUNCTION IF EXISTS trigger_set_timestamp();

-- =============================
-- DROP CUSTOM TYPES (ENUMS)
-- =============================
DROP TYPE IF EXISTS minute_version_status;
DROP TYPE IF EXISTS meeting_type;
DROP TYPE IF EXISTS transaction_status;
DROP TYPE IF EXISTS active_status;