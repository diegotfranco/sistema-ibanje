import { describe, it, expect } from 'vitest';
import { AttenderFormSchema } from './schema';

describe('AttenderFormSchema', () => {
  const validBase = {
    name: 'João Silva',
    isMember: false
  };

  it('accepts a valid minimal attender with just a name', () => {
    expect(AttenderFormSchema.safeParse(validBase).success).toBe(true);
  });

  it('rejects a name shorter than 2 chars', () => {
    const r = AttenderFormSchema.safeParse({ ...validBase, name: 'a' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'name')?.message).toBe(
        'Mínimo de 2 caracteres'
      );
    }
  });

  it('rejects a name longer than 96 chars', () => {
    const r = AttenderFormSchema.safeParse({ ...validBase, name: 'a'.repeat(97) });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'name')?.message).toBe(
        'Máximo de 96 caracteres'
      );
    }
  });

  it('accepts a valid email', () => {
    expect(AttenderFormSchema.safeParse({ ...validBase, email: 'test@example.com' }).success).toBe(
      true
    );
  });

  it('rejects an invalid email', () => {
    const r = AttenderFormSchema.safeParse({ ...validBase, email: 'not-an-email' });
    expect(r.success).toBe(false);
  });

  it('rejects a phone longer than 16 chars', () => {
    const r = AttenderFormSchema.safeParse({ ...validBase, phone: '1'.repeat(17) });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'phone')?.message).toBe(
        'Máximo de 16 caracteres'
      );
    }
  });

  it('rejects a CEP that is not 8 digits', () => {
    const r = AttenderFormSchema.safeParse({ ...validBase, postalCode: '123456' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'postalCode')?.message).toBe('CEP inválido');
    }
  });

  it('accepts a valid CEP with 8 digits', () => {
    expect(AttenderFormSchema.safeParse({ ...validBase, postalCode: '01310100' }).success).toBe(
      true
    );
  });

  it('rejects memberSince that does not match YYYY-MM format', () => {
    const r = AttenderFormSchema.safeParse({ ...validBase, memberSince: '2026/01' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'memberSince')?.message).toBe(
        'Formato esperado: MM/AAAA'
      );
    }
  });

  it('accepts memberSince in YYYY-MM format', () => {
    expect(AttenderFormSchema.safeParse({ ...validBase, memberSince: '2026-05' }).success).toBe(
      true
    );
  });

  it('rejects congregatingSince that does not match YYYY-MM format', () => {
    const r = AttenderFormSchema.safeParse({ ...validBase, congregatingSince: '01-2026' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'congregatingSince')?.message).toBe(
        'Formato esperado: MM/AAAA'
      );
    }
  });

  it('accepts congregatingSince in YYYY-MM format', () => {
    expect(
      AttenderFormSchema.safeParse({ ...validBase, congregatingSince: '2026-05' }).success
    ).toBe(true);
  });

  it('accepts optional admissionMode when provided with a valid enum value', () => {
    expect(AttenderFormSchema.safeParse({ ...validBase, admissionMode: 'aclamação' }).success).toBe(
      true
    );
  });

  it('accepts isMember as a boolean', () => {
    expect(AttenderFormSchema.safeParse({ ...validBase, isMember: true }).success).toBe(true);
  });

  it('defaults isMember to false when not provided', () => {
    const r = AttenderFormSchema.safeParse(validBase);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.isMember).toBe(false);
    }
  });

  it('accepts all address fields together', () => {
    expect(
      AttenderFormSchema.safeParse({
        ...validBase,
        addressStreet: 'Rua das Flores',
        addressNumber: '123',
        addressComplement: 'Apt 45',
        addressDistrict: 'Centro',
        state: 'SP',
        city: 'São Paulo',
        postalCode: '01310100'
      }).success
    ).toBe(true);
  });

  it('rejects state that is not 2 characters long', () => {
    const r = AttenderFormSchema.safeParse({ ...validBase, state: 'São Paulo' });
    expect(r.success).toBe(false);
  });

  it('accepts state with exactly 2 characters', () => {
    expect(AttenderFormSchema.safeParse({ ...validBase, state: 'SP' }).success).toBe(true);
  });
});
