import { describe, it, expect } from 'vitest';
import { UpdateMyProfileFormSchema } from './schema';

describe('UpdateMyProfileFormSchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    expect(UpdateMyProfileFormSchema.safeParse({}).success).toBe(true);
  });

  it('accepts an optional phone up to 16 chars', () => {
    expect(
      UpdateMyProfileFormSchema.safeParse({
        phone: '(11) 9999-9999'
      }).success
    ).toBe(true);
  });

  it('rejects a phone longer than 16 chars', () => {
    const r = UpdateMyProfileFormSchema.safeParse({
      phone: 'a'.repeat(17)
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'phone')?.message).toBe(
        'Máximo de 16 caracteres'
      );
    }
  });

  it('accepts an optional email', () => {
    expect(
      UpdateMyProfileFormSchema.safeParse({
        email: 'newemail@example.com'
      }).success
    ).toBe(true);
  });

  it('rejects an invalid email', () => {
    const r = UpdateMyProfileFormSchema.safeParse({
      email: 'not-an-email'
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'email')?.message).toBe('E-mail inválido');
    }
  });

  it('accepts an optional address', () => {
    expect(
      UpdateMyProfileFormSchema.safeParse({
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

  it('rejects addressStreet longer than 96 chars', () => {
    const r = UpdateMyProfileFormSchema.safeParse({
      addressStreet: 'a'.repeat(97)
    });
    expect(r.success).toBe(false);
  });

  it('rejects addressNumber longer than 16 chars', () => {
    const r = UpdateMyProfileFormSchema.safeParse({
      addressNumber: 'a'.repeat(17)
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'addressNumber')?.message).toBe(
        'Máximo de 16 caracteres'
      );
    }
  });

  it('rejects addressComplement longer than 64 chars', () => {
    const r = UpdateMyProfileFormSchema.safeParse({
      addressComplement: 'a'.repeat(65)
    });
    expect(r.success).toBe(false);
  });

  it('rejects addressDistrict longer than 64 chars', () => {
    const r = UpdateMyProfileFormSchema.safeParse({
      addressDistrict: 'a'.repeat(65)
    });
    expect(r.success).toBe(false);
  });

  it('rejects state that is not 2 characters long', () => {
    const r = UpdateMyProfileFormSchema.safeParse({
      state: 'São Paulo'
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'state')?.message).toBe(
        'Estado deve ter 2 caracteres'
      );
    }
  });

  it('accepts state with exactly 2 characters', () => {
    expect(
      UpdateMyProfileFormSchema.safeParse({
        state: 'SP'
      }).success
    ).toBe(true);
  });

  it('rejects city longer than 96 chars', () => {
    const r = UpdateMyProfileFormSchema.safeParse({
      city: 'a'.repeat(97)
    });
    expect(r.success).toBe(false);
  });

  it('rejects postalCode that is not 8 digits', () => {
    const r = UpdateMyProfileFormSchema.safeParse({
      postalCode: '123456'
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'postalCode')?.message).toBe('CEP inválido');
    }
  });

  it('accepts a valid postalCode with 8 digits', () => {
    expect(
      UpdateMyProfileFormSchema.safeParse({
        postalCode: '01310100'
      }).success
    ).toBe(true);
  });

  it('accepts empty strings for all fields', () => {
    expect(
      UpdateMyProfileFormSchema.safeParse({
        phone: '',
        email: '',
        addressStreet: '',
        addressNumber: '',
        addressComplement: '',
        addressDistrict: '',
        state: '',
        city: '',
        postalCode: ''
      }).success
    ).toBe(true);
  });

  it('accepts mixed filled and empty fields', () => {
    expect(
      UpdateMyProfileFormSchema.safeParse({
        phone: '(11) 9999-9999',
        email: '',
        addressStreet: 'Rua das Flores'
      }).success
    ).toBe(true);
  });
});
