import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { ApiError } from './api';

/**
 * If the error carries server-side fieldErrors, surface them under the matching
 * RHF inputs and return true. Otherwise return false so the caller can fall back
 * to a generic toast.
 */
export function applyFieldErrors<T extends FieldValues>(
  err: unknown,
  form: UseFormReturn<T>
): boolean {
  if (!(err instanceof ApiError) || !err.fieldErrors) return false;
  for (const [field, message] of Object.entries(err.fieldErrors)) {
    form.setError(field as Path<T>, { type: 'server', message });
  }
  return true;
}
