import type { FieldValues, Path, SubmitHandler, UseFormReturn } from 'react-hook-form';
import type { FormEvent } from 'react';
import { ApiError } from './api';

// Native text inputs whose value can be set by browser autofill without firing a React change event.
// (number/date/etc. are excluded — their RHF value isn't a plain string, so blindly copying the DOM
// string could clobber a coerced value.)
const AUTOFILL_SYNCABLE_TYPES = new Set(['text', 'email', 'tel', 'url', 'search', 'password', '']);

/**
 * Wrap an RHF submit so browser-autofilled values are honoured. react-hook-form tracks values via
 * React change events; a passively prefilled / autofilled field sets the DOM `.value` without one,
 * so RHF still holds the (empty or stale) default and validation wrongly fails — or the old value is
 * submitted. Here, on submit, we copy each uncontrolled register input's live DOM value into RHF
 * before it validates.
 *
 * Only inputs marked `data-autofill-sync` (set by the shared `Input` when it's uncontrolled) are
 * touched — controlled/masked widgets (EntityPicker, MaskedInput, DateInput, MoneyInput) are immune
 * to the desync and hold a *formatted* DOM value that must never be copied back verbatim.
 *
 * Use as the `<form onSubmit>` handler instead of `form.handleSubmit(onValid)`.
 */
export function autofillSafeSubmit<T extends FieldValues>(
  form: UseFormReturn<T>,
  onValid: SubmitHandler<T>
): (e: FormEvent<HTMLFormElement>) => void {
  return (e) => {
    const inputs = e.currentTarget.querySelectorAll<HTMLInputElement>(
      'input[name][data-autofill-sync]'
    );
    for (const el of inputs) {
      if (!AUTOFILL_SYNCABLE_TYPES.has(el.type)) continue;
      // Autofill always writes a non-empty value; an empty input is just "not filled", so never let
      // it overwrite RHF's default (which may legitimately be null/undefined for optional fields).
      if (el.value === '') continue;
      const name = el.name as Path<T>;
      if (form.getValues(name) !== el.value) {
        form.setValue(name, el.value as never, { shouldDirty: true });
      }
    }
    void form.handleSubmit(onValid)(e);
  };
}

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
