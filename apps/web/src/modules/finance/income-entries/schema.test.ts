import { describe, it, expect } from 'vitest';
import { IncomeEntryFormSchema } from './schema';

// The form schema is the client-side contract the income-entry form validates against before it ever
// hits the API. These assertions pin the pt-BR messages and the fund×event mutual-exclusion rule
// (which mirrors the backend guard).
function base(overrides: Record<string, unknown> = {}) {
  return {
    depositDate: '2026-05-31',
    amount: '100.00',
    categoryId: 1,
    paymentMethodId: 1,
    ...overrides
  };
}

describe('IncomeEntryFormSchema', () => {
  it('accepts a valid minimal entry', () => {
    expect(IncomeEntryFormSchema.safeParse(base()).success).toBe(true);
  });

  it('requires a deposit date', () => {
    const r = IncomeEntryFormSchema.safeParse(base({ depositDate: '' }));
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'depositDate')?.message).toBe(
        'Data de depósito é obrigatória.'
      );
    }
  });

  it('rejects an amount that is not decimal-formatted', () => {
    const r = IncomeEntryFormSchema.safeParse(base({ amount: '100,00' }));
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === 'amount')).toBe(true);
    }
  });

  it('rejects a missing amount with the obrigatório message', () => {
    const r = IncomeEntryFormSchema.safeParse(base({ amount: '' }));
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'amount')?.message).toBe(
        'Valor é obrigatório.'
      );
    }
  });

  it('rejects selecting both a designated fund and an event (mutual exclusion)', () => {
    const r = IncomeEntryFormSchema.safeParse(base({ designatedFundId: 1, eventId: 2 }));
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'eventId')?.message).toBe(
        'Selecione um fundo OU um evento, não ambos.'
      );
    }
  });

  it('accepts a fund alone and an event alone', () => {
    expect(IncomeEntryFormSchema.safeParse(base({ designatedFundId: 1 })).success).toBe(true);
    expect(IncomeEntryFormSchema.safeParse(base({ eventId: 1 })).success).toBe(true);
  });

  it('requires categoryId and paymentMethodId to be positive', () => {
    expect(IncomeEntryFormSchema.safeParse(base({ categoryId: 0 })).success).toBe(false);
    expect(IncomeEntryFormSchema.safeParse(base({ paymentMethodId: -1 })).success).toBe(false);
  });
});
