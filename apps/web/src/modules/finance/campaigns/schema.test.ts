import { describe, it, expect } from 'vitest';
import { CampaignFormSchema } from './schema';

describe('CampaignFormSchema', () => {
  const validBase = {
    name: 'Fundo de Reforma'
  };

  it('accepts a valid fund with just a name', () => {
    expect(CampaignFormSchema.safeParse(validBase).success).toBe(true);
  });

  it('rejects a name shorter than 2 chars', () => {
    const r = CampaignFormSchema.safeParse({ ...validBase, name: 'a' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'name')?.message).toBe(
        'Mínimo de 2 caracteres'
      );
    }
  });

  it('rejects a name longer than 96 chars', () => {
    const r = CampaignFormSchema.safeParse({ ...validBase, name: 'a'.repeat(97) });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'name')?.message).toBe(
        'Máximo de 96 caracteres'
      );
    }
  });

  it('accepts an optional description up to 500 chars', () => {
    expect(
      CampaignFormSchema.safeParse({
        ...validBase,
        description: 'Destina-se ao reparo e manutenção do prédio'
      }).success
    ).toBe(true);
  });

  it('rejects a description longer than 500 chars', () => {
    const r = CampaignFormSchema.safeParse({
      ...validBase,
      description: 'a'.repeat(501)
    });
    expect(r.success).toBe(false);
  });

  it('accepts an empty string for description', () => {
    expect(CampaignFormSchema.safeParse({ ...validBase, description: '' }).success).toBe(true);
  });

  it('accepts an optional targetAmount in decimal format', () => {
    expect(
      CampaignFormSchema.safeParse({
        ...validBase,
        targetAmount: '5000.00'
      }).success
    ).toBe(true);
  });

  it('accepts targetAmount with one decimal place', () => {
    expect(
      CampaignFormSchema.safeParse({
        ...validBase,
        targetAmount: '5000.5'
      }).success
    ).toBe(true);
  });

  it('rejects targetAmount with more than 2 decimal places', () => {
    const r = CampaignFormSchema.safeParse({
      ...validBase,
      targetAmount: '5000.999'
    });
    expect(r.success).toBe(false);
  });

  it('rejects targetAmount in incorrect format', () => {
    const r = CampaignFormSchema.safeParse({
      ...validBase,
      targetAmount: '5000,00'
    });
    expect(r.success).toBe(false);
  });

  it('accepts an empty string for targetAmount', () => {
    expect(
      CampaignFormSchema.safeParse({
        ...validBase,
        targetAmount: ''
      }).success
    ).toBe(true);
  });

  it('accepts an optional targetDate', () => {
    expect(
      CampaignFormSchema.safeParse({
        ...validBase,
        targetDate: '2026-12-31'
      }).success
    ).toBe(true);
  });

  it('accepts null for targetDate', () => {
    expect(
      CampaignFormSchema.safeParse({
        ...validBase,
        targetDate: null
      }).success
    ).toBe(true);
  });

  it('accepts all fields together', () => {
    expect(
      CampaignFormSchema.safeParse({
        name: 'Fundo de Reforma',
        description: 'Para o reparo do telhado',
        targetAmount: '10000.00',
        targetDate: '2026-12-31'
      }).success
    ).toBe(true);
  });
});
