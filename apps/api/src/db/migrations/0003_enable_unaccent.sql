-- Enable the `unaccent` extension so we can do diacritic-insensitive
-- searches (e.g. category search matching "salario" → "Salário").
CREATE EXTENSION IF NOT EXISTS unaccent;
