import { describe, it, expect } from 'vitest';
import { ExpenseEntryFormSchema } from './schema';

function base(overrides: Record<string, unknown> = {}) {
  return {
    isInstallment: false,
    date: '2026-05-31',
    amount: '150.00',
    categoryId: 1,
    paymentMethodId: 1,
    ...overrides
  };
}

describe('ExpenseEntryFormSchema', () => {
  it('accepts a valid minimal expense entry', () => {
    expect(ExpenseEntryFormSchema.safeParse(base()).success).toBe(true);
  });

  it('requires a date', () => {
    const r = ExpenseEntryFormSchema.safeParse(base({ date: '' }));
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'date')?.message).toBe('Data é obrigatória.');
    }
  });

  it('requires an amount', () => {
    const r = ExpenseEntryFormSchema.safeParse(base({ amount: '' }));
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'amount')?.message).toBe(
        'Valor é obrigatório.'
      );
    }
  });

  it('rejects an amount not in decimal format', () => {
    const r = ExpenseEntryFormSchema.safeParse(base({ amount: '150,00' }));
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === 'amount')).toBe(true);
    }
  });

  it('requires a valid decimal amount', () => {
    expect(ExpenseEntryFormSchema.safeParse(base({ amount: '99.99' })).success).toBe(true);
    expect(ExpenseEntryFormSchema.safeParse(base({ amount: '100' })).success).toBe(true);
  });

  it('rejects both a campaign and an event (mutual exclusion)', () => {
    const r = ExpenseEntryFormSchema.safeParse(base({ campaignId: 1, eventId: 2 }));
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'eventId')?.message).toBe(
        'Selecione uma campanha OU um evento, não ambos.'
      );
    }
  });

  it('accepts a campaign alone without an event', () => {
    expect(ExpenseEntryFormSchema.safeParse(base({ campaignId: 1 })).success).toBe(true);
  });

  it('accepts an event alone without a campaign', () => {
    expect(ExpenseEntryFormSchema.safeParse(base({ eventId: 1 })).success).toBe(true);
  });

  it('requires a positive categoryId', () => {
    const r = ExpenseEntryFormSchema.safeParse(base({ categoryId: 0 }));
    expect(r.success).toBe(false);
  });

  it('requires a positive paymentMethodId', () => {
    const r = ExpenseEntryFormSchema.safeParse(base({ paymentMethodId: -1 }));
    expect(r.success).toBe(false);
  });

  it('accepts valid isInstallment flag when false', () => {
    expect(ExpenseEntryFormSchema.safeParse(base({ isInstallment: false })).success).toBe(true);
  });

  describe('installment rules (superRefine)', () => {
    it('requires a total when isInstallment is true', () => {
      const r = ExpenseEntryFormSchema.safeParse(
        base({
          isInstallment: true,
          total: '',
          installment: 1,
          totalInstallments: 3
        })
      );
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.find((i) => i.path[0] === 'total')?.message).toBe(
          'Valor total é obrigatório.'
        );
      }
    });

    it('requires a valid installment number when isInstallment is true', () => {
      const r = ExpenseEntryFormSchema.safeParse(
        base({
          isInstallment: true,
          total: '300.00',
          installment: 0,
          totalInstallments: 3
        })
      );
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.find((i) => i.path[0] === 'installment')).toBeDefined();
      }
    });

    it('requires a valid totalInstallments when isInstallment is true', () => {
      const r = ExpenseEntryFormSchema.safeParse(
        base({
          isInstallment: true,
          total: '300.00',
          installment: 1,
          totalInstallments: 0
        })
      );
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.find((i) => i.path[0] === 'totalInstallments')).toBeDefined();
      }
    });

    it('accepts a valid installment setup', () => {
      expect(
        ExpenseEntryFormSchema.safeParse(
          base({
            isInstallment: true,
            total: '300.00',
            installment: 2,
            totalInstallments: 3
          })
        ).success
      ).toBe(true);
    });

    it('ignores installment fields when isInstallment is false', () => {
      expect(ExpenseEntryFormSchema.safeParse(base({ isInstallment: false })).success).toBe(true);
    });
  });

  it('accepts optional status values', () => {
    expect(ExpenseEntryFormSchema.safeParse(base({ status: 'pendente' })).success).toBe(true);
    expect(ExpenseEntryFormSchema.safeParse(base({ status: 'paga' })).success).toBe(true);
    expect(ExpenseEntryFormSchema.safeParse(base({ status: 'cancelada' })).success).toBe(true);
  });

  it('accepts optional notes up to 1000 chars', () => {
    expect(
      ExpenseEntryFormSchema.safeParse(base({ notes: 'Some notes about the expense' })).success
    ).toBe(true);
  });

  it('rejects notes longer than 1000 chars', () => {
    const r = ExpenseEntryFormSchema.safeParse(base({ notes: 'a'.repeat(1001) }));
    expect(r.success).toBe(false);
  });

  it('accepts empty string for notes', () => {
    expect(ExpenseEntryFormSchema.safeParse(base({ notes: '' })).success).toBe(true);
  });
});
