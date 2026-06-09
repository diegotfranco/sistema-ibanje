import { describe, it, expect } from 'vitest';
import {
  cnpjField,
  phoneField,
  cepField,
  emailField,
  optionalEmailField,
  ufField,
  trimmedString
} from '../src/lib/normalize.js';

describe('lib/normalize', () => {
  describe('cnpjField', () => {
    it('strips punctuation to 14 raw digits', () => {
      expect(cnpjField.parse('15.556.152/0001-42')).toBe('15556152000142');
    });
    it('accepts a blank value as empty', () => {
      expect(cnpjField.parse('')).toBe('');
    });
    it('rejects non-empty junk and wrong digit counts', () => {
      expect(cnpjField.safeParse('invalid').success).toBe(false);
      expect(cnpjField.safeParse('123').success).toBe(false);
    });
  });

  describe('phoneField', () => {
    it('accepts 10- and 11-digit numbers, stripping punctuation', () => {
      expect(phoneField.parse('(11) 2741-4262')).toBe('1127414262');
      expect(phoneField.parse('(11) 99999-8888')).toBe('11999998888');
    });
    it('rejects too-short non-empty input', () => {
      expect(phoneField.safeParse('123').success).toBe(false);
    });
  });

  describe('cepField', () => {
    it('strips punctuation to 8 raw digits', () => {
      expect(cepField.parse('03446-000')).toBe('03446000');
    });
    it('rejects non-empty junk', () => {
      expect(cepField.safeParse('invalid').success).toBe(false);
    });
  });

  describe('emailField / optionalEmailField', () => {
    it('trims and lowercases', () => {
      expect(emailField.parse('  John@X.COM ')).toBe('john@x.com');
    });
    it('rejects blank when required, accepts blank when optional', () => {
      expect(emailField.safeParse('').success).toBe(false);
      expect(optionalEmailField.parse('')).toBe('');
    });
    it('rejects malformed addresses', () => {
      expect(emailField.safeParse('not-an-email').success).toBe(false);
    });
  });

  describe('ufField', () => {
    it('trims and uppercases a valid UF', () => {
      expect(ufField.parse(' sp ')).toBe('SP');
    });
    it('rejects an invalid UF', () => {
      expect(ufField.safeParse('XX').success).toBe(false);
      expect(ufField.safeParse('SPX').success).toBe(false);
    });
    it('accepts blank as empty', () => {
      expect(ufField.parse('')).toBe('');
    });
  });

  describe('trimmedString', () => {
    it('trims and collapses internal whitespace', () => {
      expect(trimmedString(96).parse('  João   da  Silva ')).toBe('João da Silva');
    });
    it('preserves casing (no force-casing)', () => {
      expect(trimmedString(96).parse('jOÃO da SILVA')).toBe('jOÃO da SILVA');
    });
    it('enforces min after collapsing (whitespace-only rejected)', () => {
      expect(trimmedString(96, 2).safeParse('   ').success).toBe(false);
    });
    it('enforces max after collapsing', () => {
      expect(trimmedString(3).safeParse('abcd').success).toBe(false);
    });
  });
});
