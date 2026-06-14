import { z } from 'zod';

// Single source of truth for the password floor/ceiling on every "set a new password" form
// (reset + self-service change). Mirrors the backend `passwordField` in api `src/lib/normalize.ts`
// so the OWASP-aligned 12–64 policy can't silently drift between the two forms. Login is NOT this
// field — it only checks `min(1)` server-side, since the policy applies to set/reset/change only.
export const newPasswordField = z
  .string()
  .min(12, 'A senha deve ter no mínimo 12 caracteres')
  .max(64, 'A senha deve ter no máximo 64 caracteres');
