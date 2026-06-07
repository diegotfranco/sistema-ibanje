import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatMonthYear,
  formatMonthYearShort,
  getCurrentMonth,
  isDatePast,
  isDateFuture
} from './datetime';

// datetime.ts formats everything in APP_TZ (America/Sao_Paulo, UTC-3). The timezone is the sensitive
// bit: a UTC instant near midnight must bucket into the correct local calendar day.
describe('datetime formatting', () => {
  describe('formatDate', () => {
    it('formats a YYYY-MM-DD date string as DD/MM/YYYY', () => {
      expect(formatDate('2026-05-31')).toBe('31/05/2026');
    });

    it('returns the em-dash placeholder for null/undefined/empty', () => {
      expect(formatDate(null)).toBe('—');
      expect(formatDate(undefined)).toBe('—');
      expect(formatDate('')).toBe('—');
    });

    it('returns the placeholder for an invalid date', () => {
      expect(formatDate('not-a-date')).toBe('—');
    });

    it('buckets a UTC instant into the America/Sao_Paulo calendar day', () => {
      // 2026-03-25T02:00Z is 2026-03-24 23:00 in UTC-3 → previous local day.
      expect(formatDate('2026-03-25T02:00:00Z')).toBe('24/03/2026');
    });
  });

  describe('formatDateTime', () => {
    it('formats date + time as DD/MM/YYYY HH:mm in the app tz', () => {
      // 12:00Z → 09:00 local (UTC-3).
      expect(formatDateTime('2026-05-31T12:00:00Z')).toBe('31/05/2026 09:00');
    });

    it('returns the placeholder for null', () => {
      expect(formatDateTime(null)).toBe('—');
    });
  });

  describe('formatMonthYear / formatMonthYearShort', () => {
    it('maps a YYYY-MM string to a pt-BR long month', () => {
      expect(formatMonthYear('2026-01')).toBe('Janeiro/2026');
      expect(formatMonthYear('2026-12')).toBe('Dezembro/2026');
    });

    it('maps a YYYY-MM string to a pt-BR short month', () => {
      expect(formatMonthYearShort('2026-03')).toBe('Mar/2026');
    });
  });

  describe('getCurrentMonth', () => {
    it('returns the current month as YYYY-MM', () => {
      expect(getCurrentMonth()).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  describe('isDatePast / isDateFuture', () => {
    it('classifies a clearly past date as past, not future', () => {
      expect(isDatePast('2000-01-01')).toBe(true);
      expect(isDateFuture('2000-01-01')).toBe(false);
    });

    it('classifies a clearly future date as future, not past', () => {
      expect(isDateFuture('2099-01-01')).toBe(true);
      expect(isDatePast('2099-01-01')).toBe(false);
    });

    it('treats null as neither past nor future', () => {
      expect(isDatePast(null)).toBe(false);
      expect(isDateFuture(null)).toBe(false);
    });
  });
});
