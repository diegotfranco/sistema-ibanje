import { describe, it, expect, vi } from 'vitest';
import type { UseFormReturn, FieldValues } from 'react-hook-form';
import { applyFieldErrors } from './forms';
import { ApiError } from './api';

// applyFieldErrors is the bridge between the backend's { fieldErrors } envelope and react-hook-form.
// It returns true (and calls setError per field) only for an ApiError carrying fieldErrors; otherwise
// false, so the caller falls back to a toast.
function makeForm() {
  const setError = vi.fn();
  return { form: { setError } as unknown as UseFormReturn<FieldValues>, setError };
}

describe('applyFieldErrors', () => {
  it('places each field error under its input and returns true', () => {
    const { form, setError } = makeForm();
    const err = new ApiError(409, 'E-mail já cadastrado', { email: 'E-mail já cadastrado' });

    expect(applyFieldErrors(err, form)).toBe(true);
    expect(setError).toHaveBeenCalledWith('email', {
      type: 'server',
      message: 'E-mail já cadastrado'
    });
  });

  it('applies multiple field errors', () => {
    const { form, setError } = makeForm();
    const err = new ApiError(400, 'Validation error', {
      name: 'Obrigatório',
      'address.postalCode': 'Inválido'
    });

    expect(applyFieldErrors(err, form)).toBe(true);
    expect(setError).toHaveBeenCalledTimes(2);
    expect(setError).toHaveBeenCalledWith('address.postalCode', {
      type: 'server',
      message: 'Inválido'
    });
  });

  it('returns false for an ApiError without fieldErrors (caller toasts)', () => {
    const { form, setError } = makeForm();
    const err = new ApiError(403, 'Forbidden');

    expect(applyFieldErrors(err, form)).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });

  it('returns false for a non-ApiError', () => {
    const { form, setError } = makeForm();

    expect(applyFieldErrors(new Error('network down'), form)).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });
});
