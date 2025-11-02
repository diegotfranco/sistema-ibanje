-- This script will remove all data from the tables seeded in the 'up' migration.
-- TRUNCATE is used to quickly delete all rows and reset sequences.
-- The CASCADE option ensures that dependent rows in other tables are also removed.

TRUNCATE
  user_module_permissions,
  role_module_permissions,
  users,
  roles,
  modules,
  permissions,
  payment_methods,
  income_categories,
  expense_categories,
  fund_balances,
  board_meetings,
  minutes,
  minute_versions,
  members
RESTART IDENTITY CASCADE;