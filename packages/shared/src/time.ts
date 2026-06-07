// Single source of truth for the application's business timezone. Both the API (bucketing
// UTC timestamps onto local calendar days) and the web app (formatting/parsing) import this so
// the constant never drifts between tiers.
export const APP_TZ = 'America/Sao_Paulo';
