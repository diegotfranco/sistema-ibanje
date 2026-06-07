import { describe, it, expect } from 'vitest';
import { LoginSchema, RegisterSchema, ForgotPasswordSchema, ResetPasswordSchema } from './schema';

describe('auth form schemas', () => {
  describe('LoginSchema', () => {
    it('accepts a valid email + password + rememberMe', () => {
      expect(
        LoginSchema.safeParse({ email: 'a@b.com', password: 'longenough', rememberMe: true })
          .success
      ).toBe(true);
    });

    it('rejects an invalid email with the pt-BR message', () => {
      const r = LoginSchema.safeParse({ email: 'nope', password: 'longenough', rememberMe: false });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.find((i) => i.path[0] === 'email')?.message).toBe('E-mail inválido');
      }
    });

    it('rejects a password shorter than 8 chars', () => {
      const r = LoginSchema.safeParse({ email: 'a@b.com', password: 'short', rememberMe: false });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.find((i) => i.path[0] === 'password')?.message).toBe(
          'A senha deve ter no mínimo 8 caracteres'
        );
      }
    });
  });

  describe('RegisterSchema', () => {
    it('rejects a name shorter than 2 chars', () => {
      const r = RegisterSchema.safeParse({ name: 'a', email: 'a@b.com' });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.find((i) => i.path[0] === 'name')?.message).toBe(
          'O nome deve ter pelo menos 2 caracteres'
        );
      }
    });

    it('rejects a name longer than 96 chars', () => {
      const r = RegisterSchema.safeParse({ name: 'a'.repeat(97), email: 'a@b.com' });
      expect(r.success).toBe(false);
    });
  });

  describe('ForgotPasswordSchema', () => {
    it('requires a valid email', () => {
      expect(ForgotPasswordSchema.safeParse({ email: 'x' }).success).toBe(false);
      expect(ForgotPasswordSchema.safeParse({ email: 'x@y.com' }).success).toBe(true);
    });
  });

  describe('ResetPasswordSchema', () => {
    it('requires newPassword of at least 8 chars', () => {
      const r = ResetPasswordSchema.safeParse({ newPassword: 'short', confirmPassword: 'short' });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.find((i) => i.path[0] === 'newPassword')?.message).toBe(
          'A senha deve ter no mínimo 8 caracteres'
        );
      }
    });

    it('rejects a mismatched confirmation with the path on confirmPassword', () => {
      const r = ResetPasswordSchema.safeParse({
        newPassword: 'longenough1',
        confirmPassword: 'different1'
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.find((i) => i.path[0] === 'confirmPassword')?.message).toBe(
          'As senhas não coincidem'
        );
      }
    });

    it('accepts matching passwords of sufficient length', () => {
      expect(
        ResetPasswordSchema.safeParse({
          newPassword: 'longenough1',
          confirmPassword: 'longenough1'
        }).success
      ).toBe(true);
    });
  });
});
