import { describe, it, expect } from 'vitest';
import { formatCnpj, formatPhone, formatCep } from '../src/lib/format.js';

describe('lib/format', () => {
  describe('formatCnpj', () => {
    it('formats 14 raw digits', () => {
      expect(formatCnpj('15556152000142')).toBe('15.556.152/0001-42');
    });
    it('passes through unexpected lengths and empties unchanged', () => {
      expect(formatCnpj('123')).toBe('123');
      expect(formatCnpj('')).toBe('');
      expect(formatCnpj(null)).toBe('');
      expect(formatCnpj(undefined)).toBe('');
    });
  });

  describe('formatPhone', () => {
    it('formats 11-digit mobile and 10-digit landline', () => {
      expect(formatPhone('11999998888')).toBe('(11) 99999-8888');
      expect(formatPhone('1127414262')).toBe('(11) 2741-4262');
    });
    it('passes through unexpected lengths and empties unchanged', () => {
      expect(formatPhone('123')).toBe('123');
      expect(formatPhone(null)).toBe('');
    });
  });

  describe('formatCep', () => {
    it('formats 8 raw digits', () => {
      expect(formatCep('03446000')).toBe('03446-000');
    });
    it('passes through unexpected lengths and empties unchanged', () => {
      expect(formatCep('123')).toBe('123');
      expect(formatCep(null)).toBe('');
    });
  });
});
