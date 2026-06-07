import { describe, it, expect } from 'vitest';
import { CalendarEntryFormSchema } from './schema';

describe('CalendarEntryFormSchema', () => {
  const validBase = {
    title: 'Culto de Celebração',
    date: '2026-05-31'
  };

  it('accepts a valid calendar entry with title and date', () => {
    expect(CalendarEntryFormSchema.safeParse(validBase).success).toBe(true);
  });

  it('rejects a title shorter than 2 chars', () => {
    const r = CalendarEntryFormSchema.safeParse({ ...validBase, title: 'a' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'title')?.message).toBe(
        'Mínimo de 2 caracteres'
      );
    }
  });

  it('rejects a title longer than 128 chars', () => {
    const r = CalendarEntryFormSchema.safeParse({ ...validBase, title: 'a'.repeat(129) });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'title')?.message).toBe(
        'Máximo de 128 caracteres'
      );
    }
  });

  it('rejects a date not in YYYY-MM-DD format', () => {
    const r = CalendarEntryFormSchema.safeParse({ ...validBase, date: '31/05/2026' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'date')?.message).toBe(
        'Informe uma data válida.'
      );
    }
  });

  it('accepts a valid YYYY-MM-DD date', () => {
    expect(CalendarEntryFormSchema.safeParse({ ...validBase, date: '2026-12-25' }).success).toBe(
      true
    );
  });

  it('accepts an optional notes field up to 2000 chars', () => {
    expect(
      CalendarEntryFormSchema.safeParse({
        ...validBase,
        notes: 'Preparar materiais para o culto'
      }).success
    ).toBe(true);
  });

  it('rejects notes longer than 2000 chars', () => {
    const r = CalendarEntryFormSchema.safeParse({
      ...validBase,
      notes: 'a'.repeat(2001)
    });
    expect(r.success).toBe(false);
  });

  it('accepts an empty string for notes', () => {
    expect(CalendarEntryFormSchema.safeParse({ ...validBase, notes: '' }).success).toBe(true);
  });

  it('accepts all fields together', () => {
    expect(
      CalendarEntryFormSchema.safeParse({
        title: 'Assembléia de Membros',
        date: '2026-06-15',
        notes: 'Reunião importante com todos os membros'
      }).success
    ).toBe(true);
  });
});
