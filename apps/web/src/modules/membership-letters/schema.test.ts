import { describe, it, expect } from 'vitest';
import { MembershipLetterFormSchema } from './schema';

describe('MembershipLetterFormSchema', () => {
  const validBase = {
    type: 'carta_de_transferência' as const,
    attenderId: 1,
    letterDate: '2026-05-31',
    otherChurchName: 'Igreja Batista de São Paulo',
    otherChurchCity: 'São Paulo'
  };

  it('accepts a valid membership letter with required fields', () => {
    expect(MembershipLetterFormSchema.safeParse(validBase).success).toBe(true);
  });

  it('accepts pedido_de_carta_de_transferência type', () => {
    expect(
      MembershipLetterFormSchema.safeParse({
        ...validBase,
        type: 'pedido_de_carta_de_transferência'
      }).success
    ).toBe(true);
  });

  it('rejects an invalid type', () => {
    const r = MembershipLetterFormSchema.safeParse({
      ...validBase,
      type: 'invalid_type'
    } as unknown);
    expect(r.success).toBe(false);
  });

  it('requires a positive attenderId', () => {
    const r = MembershipLetterFormSchema.safeParse({ ...validBase, attenderId: 0 });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'attenderId')?.message).toBe(
        'Congregado obrigatório'
      );
    }
  });

  it('requires a valid letterDate', () => {
    const r = MembershipLetterFormSchema.safeParse({ ...validBase, letterDate: '2026-05-31' });
    expect(r.success).toBe(true);
  });

  it('rejects an invalid letterDate format', () => {
    const r = MembershipLetterFormSchema.safeParse({ ...validBase, letterDate: '31/05/2026' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'letterDate')?.message).toBe(
        'Data obrigatória no formato YYYY-MM-DD'
      );
    }
  });

  it('requires a non-empty otherChurchName', () => {
    const r = MembershipLetterFormSchema.safeParse({ ...validBase, otherChurchName: '' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'otherChurchName')?.message).toBe(
        'Nome da igreja obrigatório'
      );
    }
  });

  it('rejects otherChurchName longer than 128 chars', () => {
    const r = MembershipLetterFormSchema.safeParse({
      ...validBase,
      otherChurchName: 'a'.repeat(129)
    });
    expect(r.success).toBe(false);
  });

  it('requires a non-empty otherChurchCity', () => {
    const r = MembershipLetterFormSchema.safeParse({ ...validBase, otherChurchCity: '' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'otherChurchCity')?.message).toBe(
        'Cidade obrigatória'
      );
    }
  });

  it('rejects otherChurchCity longer than 96 chars', () => {
    const r = MembershipLetterFormSchema.safeParse({
      ...validBase,
      otherChurchCity: 'a'.repeat(97)
    });
    expect(r.success).toBe(false);
  });

  it('accepts an optional otherChurchAddress', () => {
    expect(
      MembershipLetterFormSchema.safeParse({
        ...validBase,
        otherChurchAddress: 'Rua das Flores, 123'
      }).success
    ).toBe(true);
  });

  it('rejects otherChurchAddress longer than 256 chars', () => {
    const r = MembershipLetterFormSchema.safeParse({
      ...validBase,
      otherChurchAddress: 'a'.repeat(257)
    });
    expect(r.success).toBe(false);
  });

  it('accepts an optional otherChurchState with 2 characters', () => {
    expect(
      MembershipLetterFormSchema.safeParse({
        ...validBase,
        otherChurchState: 'SP'
      }).success
    ).toBe(true);
  });

  it('rejects otherChurchState not 2 chars long', () => {
    const r = MembershipLetterFormSchema.safeParse({
      ...validBase,
      otherChurchState: 'São Paulo'
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'otherChurchState')?.message).toBe(
        'Estado deve ter 2 caracteres'
      );
    }
  });

  it('accepts empty string for otherChurchState', () => {
    expect(
      MembershipLetterFormSchema.safeParse({
        ...validBase,
        otherChurchState: ''
      }).success
    ).toBe(true);
  });

  it('accepts an optional additionalContext up to 2048 chars', () => {
    expect(
      MembershipLetterFormSchema.safeParse({
        ...validBase,
        additionalContext: 'Some additional information'
      }).success
    ).toBe(true);
  });

  it('rejects additionalContext longer than 2048 chars', () => {
    const r = MembershipLetterFormSchema.safeParse({
      ...validBase,
      additionalContext: 'a'.repeat(2049)
    });
    expect(r.success).toBe(false);
  });

  it('accepts empty string for additionalContext', () => {
    expect(
      MembershipLetterFormSchema.safeParse({
        ...validBase,
        additionalContext: ''
      }).success
    ).toBe(true);
  });
});
