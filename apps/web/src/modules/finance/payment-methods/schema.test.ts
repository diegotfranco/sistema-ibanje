import { describe, it, expect } from 'vitest';
import { PaymentMethodFormSchema } from './schema';

describe('PaymentMethodFormSchema', () => {
  const validBase = {
    name: 'Dinheiro',
    allowsInflow: true,
    allowsOutflow: true
  };

  it('accepts a valid payment method with name and both flags', () => {
    expect(PaymentMethodFormSchema.safeParse(validBase).success).toBe(true);
  });

  it('rejects a name shorter than 2 chars', () => {
    const r = PaymentMethodFormSchema.safeParse({ ...validBase, name: 'a' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'name')?.message).toBe(
        'Mínimo de 2 caracteres'
      );
    }
  });

  it('rejects a name longer than 64 chars', () => {
    const r = PaymentMethodFormSchema.safeParse({ ...validBase, name: 'a'.repeat(65) });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'name')?.message).toBe(
        'Máximo de 64 caracteres'
      );
    }
  });

  it('accepts a payment method with only inflow enabled', () => {
    expect(
      PaymentMethodFormSchema.safeParse({
        name: 'PIX',
        allowsInflow: true,
        allowsOutflow: false
      }).success
    ).toBe(true);
  });

  it('accepts a payment method with only outflow enabled', () => {
    expect(
      PaymentMethodFormSchema.safeParse({
        name: 'Cheque',
        allowsInflow: false,
        allowsOutflow: true
      }).success
    ).toBe(true);
  });

  it('rejects when both flags are false', () => {
    const r = PaymentMethodFormSchema.safeParse({
      name: 'Test',
      allowsInflow: false,
      allowsOutflow: false
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'allowsInflow')?.message).toBe(
        'Selecione ao menos entrada ou saída.'
      );
    }
  });
});
