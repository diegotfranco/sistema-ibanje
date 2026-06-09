import { describe, it, expect } from 'vitest';
import {
  formatCnpj,
  formatPhone,
  formatCep,
  maskCnpj,
  maskPhone,
  maskCep,
  toDigits
} from './format';

describe('lib/format display formatters', () => {
  it('formatCnpj formats 14 digits, passes through the rest', () => {
    expect(formatCnpj('15556152000142')).toBe('15.556.152/0001-42');
    expect(formatCnpj('123')).toBe('123');
    expect(formatCnpj(null)).toBe('');
  });

  it('formatPhone handles mobile and landline', () => {
    expect(formatPhone('11999998888')).toBe('(11) 99999-8888');
    expect(formatPhone('1127414262')).toBe('(11) 2741-4262');
    expect(formatPhone(undefined)).toBe('');
  });

  it('formatCep formats 8 digits', () => {
    expect(formatCep('03446000')).toBe('03446-000');
    expect(formatCep('')).toBe('');
  });
});

describe('lib/format progressive masks', () => {
  it('maskCnpj formats progressively and caps at 14 digits', () => {
    expect(maskCnpj('15')).toBe('15');
    expect(maskCnpj('15556')).toBe('15.556');
    expect(maskCnpj('155561520001429999')).toBe('15.556.152/0001-42');
  });

  it('maskPhone splits at 4 (landline) or 5 (mobile) digits', () => {
    expect(maskPhone('11')).toBe('(11');
    expect(maskPhone('1127414262')).toBe('(11) 2741-4262');
    expect(maskPhone('11999998888')).toBe('(11) 99999-8888');
  });

  it('maskCep inserts the dash after 5 digits', () => {
    expect(maskCep('034')).toBe('034');
    expect(maskCep('03446000')).toBe('03446-000');
  });

  it('toDigits strips everything but digits', () => {
    expect(toDigits('(11) 99999-8888')).toBe('11999998888');
  });
});
