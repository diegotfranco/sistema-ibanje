import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PasswordStrengthBar, passwordStrength } from './PasswordStrengthBar';

describe('passwordStrength', () => {
  it('scores an empty password as 0', () => {
    expect(passwordStrength('')).toBe(0);
  });

  it('scores anything below the 12-char floor as Fraca (1)', () => {
    expect(passwordStrength('abc')).toBe(1);
    expect(passwordStrength('Abc123!@xyz')).toBe(1); // 11 chars, varied, still below floor
  });

  it('scores a 12–15 char low-variety password as Boa (2)', () => {
    expect(passwordStrength('senhaboa1234')).toBe(2); // 12 chars, letters+digits = variety 2
  });

  it('rewards a long passphrase as Forte (3) on length alone', () => {
    expect(passwordStrength('cavalocorretobateriagrampo')).toBe(3); // 26 chars, lowercase only
  });

  it('rewards a shorter but varied password as Forte (3)', () => {
    expect(passwordStrength('Abc123!@xyz9')).toBe(3); // 12 chars, variety 4
  });
});

describe('PasswordStrengthBar', () => {
  it('renders an empty track with no label when the password is empty', () => {
    render(<PasswordStrengthBar value="" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuetext', 'Sem senha');
    expect(screen.queryByText(/Força:/)).not.toBeInTheDocument();
  });

  it('shows the Fraca level and a length-focused tip below the floor', () => {
    render(<PasswordStrengthBar value="abc" />);
    expect(screen.getByText('Fraca')).toBeInTheDocument();
    expect(screen.getByText(/Adicione mais caracteres/)).toBeInTheDocument();
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuetext', 'Fraca');
  });

  it('shows the Boa level and a variety/length tip for a 12-char low-variety password', () => {
    render(<PasswordStrengthBar value="senhaboa1234" />);
    expect(screen.getByText('Boa')).toBeInTheDocument();
    expect(screen.getByText(/Use uma frase longa/)).toBeInTheDocument();
  });

  it('shows the Forte level and the success tip for a long passphrase', () => {
    render(<PasswordStrengthBar value="cavalocorretobateriagrampo" />);
    expect(screen.getByText('Forte')).toBeInTheDocument();
    expect(screen.getByText(/Senha forte\./)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', 'Forte');
  });

  it('ticks the checklist items in sync with the score', () => {
    // 12-char low-variety: length met, booster not yet met.
    render(<PasswordStrengthBar value="senhaboa1234" />);
    const lengthItem = screen.getByText('Entre 12 e 64 caracteres');
    const boosterItem = screen.getByText('16+ caracteres, ou letras, números e símbolos');
    expect(lengthItem.className).toContain('text-foreground');
    expect(boosterItem.className).toContain('text-muted-foreground');
  });

  it('leaves the length item unticked when the password exceeds 64 chars', () => {
    render(<PasswordStrengthBar value={'a'.repeat(65)} />);
    expect(screen.getByText('Entre 12 e 64 caracteres').className).toContain(
      'text-muted-foreground'
    );
  });

  it('always shows the allowed-chars info line, even when empty', () => {
    const { rerender } = render(<PasswordStrengthBar value="" />);
    expect(
      screen.getByText(/Letras, números, símbolos e espaços são permitidos/)
    ).toBeInTheDocument();
    rerender(<PasswordStrengthBar value="cavalocorretobateriagrampo" />);
    expect(
      screen.getByText(/Letras, números, símbolos e espaços são permitidos/)
    ).toBeInTheDocument();
  });
});
