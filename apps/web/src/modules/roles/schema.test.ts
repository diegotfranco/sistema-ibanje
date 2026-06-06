import { describe, it, expect } from 'vitest';
import { RoleFormSchema } from './schema';

describe('RoleFormSchema', () => {
  const validBase = {
    name: 'Editor de Conteúdo'
  };

  it('accepts a valid role with just a name', () => {
    expect(RoleFormSchema.safeParse(validBase).success).toBe(true);
  });

  it('rejects a name shorter than 2 chars', () => {
    const r = RoleFormSchema.safeParse({ ...validBase, name: 'a' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'name')?.message).toBe(
        'Mínimo de 2 caracteres'
      );
    }
  });

  it('rejects a name longer than 64 chars', () => {
    const r = RoleFormSchema.safeParse({ ...validBase, name: 'a'.repeat(65) });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'name')?.message).toBe(
        'Máximo de 64 caracteres'
      );
    }
  });

  it('accepts an optional description up to 256 chars', () => {
    expect(
      RoleFormSchema.safeParse({
        ...validBase,
        description: 'Uma descrição que explica o papel'
      }).success
    ).toBe(true);
  });

  it('rejects a description longer than 256 chars', () => {
    const r = RoleFormSchema.safeParse({
      ...validBase,
      description: 'a'.repeat(257)
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'description')?.message).toBe(
        'Máximo de 256 caracteres'
      );
    }
  });

  it('accepts an empty string for description', () => {
    expect(RoleFormSchema.safeParse({ ...validBase, description: '' }).success).toBe(true);
  });

  it('accepts undefined for description', () => {
    expect(RoleFormSchema.safeParse(validBase).success).toBe(true);
  });
});
