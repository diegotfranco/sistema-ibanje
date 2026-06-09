import { z } from 'zod';
import { UF_VALUES } from '@sistema-ibanje/shared';

// Boundary normalization helpers. The backend Zod request schema is the single source of
// truth for how values are stored: documents/contacts are reduced to raw digits, email to
// trimmed lowercase, UF to uppercase, and all plain free-text to trimmed + whitespace-
// collapsed. Display formatting (re-adding punctuation) lives in `lib/format.ts` and the web
// app — never in storage. See `lib/format.ts` for the inverse.
//
// All builders accept the empty string as an explicit "empty" value so they compose with the
// optional fields whose forms submit `''` for a blank input. Callers add `.optional()` /
// `.nullable()` to mirror each column's nullability.

const UF_SET = UF_VALUES as readonly string[];

/**
 * Strips every non-digit and stores the digits. A blank (or whitespace-only) input is accepted
 * as "empty"; any other input must yield exactly one of `lengths` digits — so junk like
 * `"invalid"` is rejected rather than silently coerced to `''`. Validation runs on the original
 * value, the transform produces the stored digits.
 */
function digitsField(lengths: readonly number[], label: string) {
  return z
    .string()
    .refine((s) => s.trim() === '' || lengths.includes(s.replace(/\D/g, '').length), {
      message: `${label} inválido`
    })
    .transform((s) => s.replace(/\D/g, ''));
}

/** CNPJ → 14 raw digits (`15.556.152/0001-42` → `15556152000142`). Check digits not validated. */
export const cnpjField = digitsField([14], 'CNPJ');

/** BR phone → 10 (landline) or 11 (mobile) raw digits (`(11) 99999-9999` → `11999999999`). */
export const phoneField = digitsField([10, 11], 'Telefone');

/** CEP → 8 raw digits (`03446-000` → `03446000`). */
export const cepField = digitsField([8], 'CEP');

/** Email → trimmed + lowercased (`  John@X.COM ` → `john@x.com`). Required: rejects `''`. */
export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .refine((s) => z.email().safeParse(s).success, { message: 'Email inválido' });

/** Like {@link emailField} but accepts `''` — for optional fields whose forms submit a blank. */
export const optionalEmailField = z
  .string()
  .trim()
  .toLowerCase()
  .refine((s) => s === '' || z.email().safeParse(s).success, { message: 'Email inválido' });

/** UF → trimmed + uppercased, validated against the 27 federative units; accepts `''`. */
export const ufField = z
  .string()
  .trim()
  .toUpperCase()
  .refine((s) => s === '' || UF_SET.includes(s), { message: 'UF inválida' });

/**
 * Plain free-text → trimmed with internal whitespace runs collapsed to a single space
 * (`"  João  da  Silva "` → `"João da Silva"`). Casing is preserved on purpose — it is lossy
 * and the read-time `unaccent(lower())` search already matches case-insensitively. Pass `min`
 * to reject whitespace-only input for required fields.
 */
export function trimmedString(max?: number, min = 0) {
  let out = z.string();
  if (min > 0) out = out.min(min);
  if (max !== undefined) out = out.max(max);
  return z
    .string()
    .trim()
    .transform((s) => s.replace(/\s+/g, ' '))
    .pipe(out);
}
