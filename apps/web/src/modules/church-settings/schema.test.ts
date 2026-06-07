import { describe, it, expect } from 'vitest';
import { ChurchSettingsFormSchema } from './schema';

describe('ChurchSettingsFormSchema', () => {
  const validBase = {
    name: 'Igreja Batista de São Paulo',
    addressStreet: 'Rua das Flores',
    addressNumber: '123',
    addressDistrict: 'Centro',
    addressCity: 'São Paulo',
    addressState: 'sp',
    postalCode: '01310100'
  };

  it('accepts a valid church settings form with required fields', () => {
    expect(ChurchSettingsFormSchema.safeParse(validBase).success).toBe(true);
  });

  it('rejects an empty name', () => {
    const r = ChurchSettingsFormSchema.safeParse({ ...validBase, name: '' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'name')?.message).toBe('Nome obrigatório');
    }
  });

  it('rejects a name longer than 128 chars', () => {
    const r = ChurchSettingsFormSchema.safeParse({ ...validBase, name: 'a'.repeat(129) });
    expect(r.success).toBe(false);
  });

  it('accepts an optional CNPJ up to 18 chars', () => {
    expect(
      ChurchSettingsFormSchema.safeParse({
        ...validBase,
        cnpj: '12.345.678/0001-90'
      }).success
    ).toBe(true);
  });

  it('rejects a CNPJ longer than 18 chars', () => {
    const r = ChurchSettingsFormSchema.safeParse({
      ...validBase,
      cnpj: 'a'.repeat(19)
    });
    expect(r.success).toBe(false);
  });

  it('rejects an empty street', () => {
    const r = ChurchSettingsFormSchema.safeParse({ ...validBase, addressStreet: '' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'addressStreet')?.message).toBe(
        'Rua obrigatória'
      );
    }
  });

  it('rejects a street longer than 128 chars', () => {
    const r = ChurchSettingsFormSchema.safeParse({
      ...validBase,
      addressStreet: 'a'.repeat(129)
    });
    expect(r.success).toBe(false);
  });

  it('rejects an empty address number', () => {
    const r = ChurchSettingsFormSchema.safeParse({ ...validBase, addressNumber: '' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'addressNumber')?.message).toBe(
        'Número obrigatório'
      );
    }
  });

  it('rejects an address number longer than 16 chars', () => {
    const r = ChurchSettingsFormSchema.safeParse({
      ...validBase,
      addressNumber: 'a'.repeat(17)
    });
    expect(r.success).toBe(false);
  });

  it('rejects an empty district', () => {
    const r = ChurchSettingsFormSchema.safeParse({ ...validBase, addressDistrict: '' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'addressDistrict')?.message).toBe(
        'Bairro obrigatório'
      );
    }
  });

  it('rejects a district longer than 64 chars', () => {
    const r = ChurchSettingsFormSchema.safeParse({
      ...validBase,
      addressDistrict: 'a'.repeat(65)
    });
    expect(r.success).toBe(false);
  });

  it('rejects an empty city', () => {
    const r = ChurchSettingsFormSchema.safeParse({ ...validBase, addressCity: '' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'addressCity')?.message).toBe(
        'Cidade obrigatória'
      );
    }
  });

  it('rejects a city longer than 64 chars', () => {
    const r = ChurchSettingsFormSchema.safeParse({
      ...validBase,
      addressCity: 'a'.repeat(65)
    });
    expect(r.success).toBe(false);
  });

  it('rejects an addressState not 2 chars long', () => {
    const r = ChurchSettingsFormSchema.safeParse({ ...validBase, addressState: 'São Paulo' });
    expect(r.success).toBe(false);
  });

  it('accepts addressState in lowercase and transforms to uppercase', () => {
    const r = ChurchSettingsFormSchema.safeParse({ ...validBase, addressState: 'sp' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.addressState).toBe('SP');
    }
  });

  it('requires a postalCode with exactly 8 digits', () => {
    const r = ChurchSettingsFormSchema.safeParse({ ...validBase, postalCode: '123456' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'postalCode')?.message).toBe(
        'Código postal deve ter 8 dígitos'
      );
    }
  });

  it('accepts a valid postalCode with 8 digits', () => {
    expect(
      ChurchSettingsFormSchema.safeParse({
        ...validBase,
        postalCode: '01310100'
      }).success
    ).toBe(true);
  });

  it('accepts an optional phone up to 20 chars', () => {
    expect(
      ChurchSettingsFormSchema.safeParse({
        ...validBase,
        phone: '(11) 9999-9999'
      }).success
    ).toBe(true);
  });

  it('rejects a phone longer than 20 chars', () => {
    const r = ChurchSettingsFormSchema.safeParse({
      ...validBase,
      phone: 'a'.repeat(21)
    });
    expect(r.success).toBe(false);
  });

  it('accepts an optional email', () => {
    expect(
      ChurchSettingsFormSchema.safeParse({
        ...validBase,
        email: 'info@church.com'
      }).success
    ).toBe(true);
  });

  it('rejects an invalid email', () => {
    const r = ChurchSettingsFormSchema.safeParse({
      ...validBase,
      email: 'not-an-email'
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'email')?.message).toBe('Email inválido');
    }
  });

  it('accepts an optional websiteUrl up to 128 chars', () => {
    expect(
      ChurchSettingsFormSchema.safeParse({
        ...validBase,
        websiteUrl: 'https://www.church.com'
      }).success
    ).toBe(true);
  });

  it('rejects a websiteUrl longer than 128 chars', () => {
    const r = ChurchSettingsFormSchema.safeParse({
      ...validBase,
      websiteUrl: 'https://www.' + 'a'.repeat(130)
    });
    expect(r.success).toBe(false);
  });

  it('accepts optional president and secretary names up to their char limits', () => {
    expect(
      ChurchSettingsFormSchema.safeParse({
        ...validBase,
        currentPresidentName: 'João Silva Santos',
        currentPresidentTitle: 'Presidente',
        currentSecretaryName: 'Maria Oliveira Costa',
        currentSecretaryTitle: 'Secretária'
      }).success
    ).toBe(true);
  });

  it('rejects president name longer than 96 chars', () => {
    const r = ChurchSettingsFormSchema.safeParse({
      ...validBase,
      currentPresidentName: 'a'.repeat(97)
    });
    expect(r.success).toBe(false);
  });

  it('rejects president title longer than 48 chars', () => {
    const r = ChurchSettingsFormSchema.safeParse({
      ...validBase,
      currentPresidentTitle: 'a'.repeat(49)
    });
    expect(r.success).toBe(false);
  });

  it('rejects secretary name longer than 96 chars', () => {
    const r = ChurchSettingsFormSchema.safeParse({
      ...validBase,
      currentSecretaryName: 'a'.repeat(97)
    });
    expect(r.success).toBe(false);
  });

  it('rejects secretary title longer than 48 chars', () => {
    const r = ChurchSettingsFormSchema.safeParse({
      ...validBase,
      currentSecretaryTitle: 'a'.repeat(49)
    });
    expect(r.success).toBe(false);
  });

  it('accepts empty strings for optional fields', () => {
    expect(
      ChurchSettingsFormSchema.safeParse({
        ...validBase,
        cnpj: '',
        phone: '',
        email: '',
        websiteUrl: '',
        currentPresidentName: '',
        currentPresidentTitle: '',
        currentSecretaryName: '',
        currentSecretaryTitle: ''
      }).success
    ).toBe(true);
  });
});
