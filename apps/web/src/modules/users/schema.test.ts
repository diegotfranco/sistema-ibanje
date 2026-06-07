import { describe, it, expect } from 'vitest';
import { UserCreateFormSchema, UserEditFormSchema } from './schema';

describe('UserCreateFormSchema', () => {
  const validBase = {
    name: 'João Silva',
    email: 'joao@example.com',
    roleId: 1
  };

  it('accepts a valid user creation with name, email, and roleId', () => {
    expect(UserCreateFormSchema.safeParse(validBase).success).toBe(true);
  });

  it('rejects an empty name', () => {
    const r = UserCreateFormSchema.safeParse({ ...validBase, name: '' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'name')?.message).toBe('Nome é obrigatório');
    }
  });

  it('rejects a name longer than 96 chars', () => {
    const r = UserCreateFormSchema.safeParse({ ...validBase, name: 'a'.repeat(97) });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'name')?.message).toBe(
        'Máximo de 96 caracteres'
      );
    }
  });

  it('rejects an invalid email', () => {
    const r = UserCreateFormSchema.safeParse({ ...validBase, email: 'not-an-email' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'email')?.message).toBe('E-mail inválido');
    }
  });

  it('rejects a missing roleId', () => {
    const r = UserCreateFormSchema.safeParse({ ...validBase, roleId: undefined });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'roleId')?.message).toBe(
        'Cargo é obrigatório.'
      );
    }
  });

  it('rejects a non-positive roleId', () => {
    const r = UserCreateFormSchema.safeParse({ ...validBase, roleId: 0 });
    expect(r.success).toBe(false);
  });

  it('accepts an optional attenderId when provided', () => {
    expect(UserCreateFormSchema.safeParse({ ...validBase, attenderId: 5 }).success).toBe(true);
  });

  it('accepts a null attenderId', () => {
    expect(UserCreateFormSchema.safeParse({ ...validBase, attenderId: null }).success).toBe(true);
  });
});

describe('UserEditFormSchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    expect(UserEditFormSchema.safeParse({}).success).toBe(true);
  });

  it('accepts editing only the name', () => {
    expect(UserEditFormSchema.safeParse({ name: 'Nova Nome' }).success).toBe(true);
  });

  it('accepts editing only the email', () => {
    expect(UserEditFormSchema.safeParse({ email: 'new@example.com' }).success).toBe(true);
  });

  it('accepts editing only the roleId', () => {
    expect(UserEditFormSchema.safeParse({ roleId: 2 }).success).toBe(true);
  });

  it('rejects an empty name when provided', () => {
    const r = UserEditFormSchema.safeParse({ name: '' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'name')?.message).toBe('Nome é obrigatório');
    }
  });

  it('rejects an invalid email when provided', () => {
    const r = UserEditFormSchema.safeParse({ email: 'invalid-email' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'email')?.message).toBe('E-mail inválido');
    }
  });

  it('rejects a non-positive roleId when provided', () => {
    const r = UserEditFormSchema.safeParse({ roleId: 0 });
    expect(r.success).toBe(false);
  });

  it('accepts multiple fields at once', () => {
    expect(
      UserEditFormSchema.safeParse({
        name: 'New Name',
        email: 'new@example.com',
        roleId: 3
      }).success
    ).toBe(true);
  });
});
