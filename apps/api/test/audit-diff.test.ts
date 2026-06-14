import { describe, it, expect } from 'vitest';
import { diffEntity, diffResponse, diffGrants } from '../src/lib/audit.js';

describe('diffEntity', () => {
  it('returns only the changed fields as { from, to }', () => {
    const before = { name: 'Ana', phone: '111', email: 'a@x.com' };
    const after = { name: 'Ana', phone: '222', email: 'a@x.com' };
    expect(diffEntity(before, after)).toEqual({ phone: { from: '111', to: '222' } });
  });

  it('treats null and undefined as equal (no spurious diff)', () => {
    expect(diffEntity({ a: null }, { a: undefined })).toBeUndefined();
  });

  it('treats empty string, null and undefined as the same "no value"', () => {
    // Nullable column vs ''-defaulted column (church settings email/website) must not phantom-diff.
    expect(diffEntity({ email: null }, { email: '' })).toBeUndefined();
    expect(diffEntity({ email: '' }, { email: null })).toBeUndefined();
    expect(diffEntity({ city: '' }, { city: undefined })).toBeUndefined();
    // A real value vs blank still diffs (with blank shown as null).
    expect(diffEntity({ city: '' }, { city: 'Campo Grande' })).toEqual({
      city: { from: null, to: 'Campo Grande' }
    });
  });

  it('compares nested objects/arrays by value, not reference', () => {
    const before = { tags: ['x', 'y'] };
    const after = { tags: ['x', 'y'] };
    expect(diffEntity(before, after)).toBeUndefined();
    expect(diffEntity({ tags: ['x'] }, { tags: ['x', 'z'] })).toEqual({
      tags: { from: ['x'], to: ['x', 'z'] }
    });
  });

  it('excludes audit-noise and secret fields', () => {
    const before = { id: 1, name: 'A', passwordHash: 'old', updatedAt: new Date(0) };
    const after = { id: 1, name: 'B', passwordHash: 'new', updatedAt: new Date(1) };
    expect(diffEntity(before, after)).toEqual({ name: { from: 'A', to: 'B' } });
  });

  it('returns undefined when nothing meaningful changed', () => {
    expect(diffEntity({ name: 'A' }, { name: 'A' })).toBeUndefined();
  });

  it('captures keys present on only one side', () => {
    expect(diffEntity({ a: 1 }, { a: 1, b: 2 })).toEqual({ b: { from: null, to: 2 } });
  });
});

describe('diffResponse', () => {
  it('is null-tolerant on either side', () => {
    expect(diffResponse(null, { a: 1 })).toBeUndefined();
    expect(diffResponse({ a: 1 }, null)).toBeUndefined();
  });

  it('diffs two response DTOs', () => {
    expect(diffResponse({ status: 'paga' }, { status: 'cancelada' })).toEqual({
      status: { from: 'paga', to: 'cancelada' }
    });
  });
});

describe('diffGrants', () => {
  it('marks added grants false→true and removed grants true→false', () => {
    const before = ['Financeiro · Acessar', 'Usuários · Editar'];
    const after = ['Financeiro · Acessar', 'Financeiro · Cadastrar'];
    expect(diffGrants(before, after)).toEqual({
      'Financeiro · Cadastrar': { from: false, to: true },
      'Usuários · Editar': { from: true, to: false }
    });
  });

  it('returns undefined when the grant set is unchanged (order-insensitive)', () => {
    expect(diffGrants(['A', 'B'], ['B', 'A'])).toBeUndefined();
  });
});
