import { describe, it, expect } from 'vitest';
import { formatAuditValue } from './schema';

describe('formatAuditValue', () => {
  it('renders nullish/empty as an em dash', () => {
    expect(formatAuditValue(null)).toBe('—');
    expect(formatAuditValue(undefined)).toBe('—');
    expect(formatAuditValue('')).toBe('—');
  });

  it('renders booleans as Sim/Não', () => {
    expect(formatAuditValue(true)).toBe('Sim');
    expect(formatAuditValue(false)).toBe('Não');
  });

  it('masks raw phone digits when the field is `phone`', () => {
    expect(formatAuditValue('67981260005', 'phone')).toBe('(67) 98126-0005');
  });

  it('masks raw CEP digits when the field is `postalCode`', () => {
    expect(formatAuditValue('03446000', 'postalCode')).toBe('03446-000');
  });

  it('masks raw CNPJ digits when the field is `cnpj`', () => {
    expect(formatAuditValue('15556152000142', 'cnpj')).toBe('15.556.152/0001-42');
  });

  it('formats money strings when the field is `amount`/`openingBalance`', () => {
    expect(formatAuditValue('1234.5', 'amount')).toBe('R$ 1.234,50');
    expect(formatAuditValue('1000', 'openingBalance')).toBe('R$ 1.000,00');
  });

  it('leaves unknown fields as a plain string', () => {
    expect(formatAuditValue('Diego', 'name')).toBe('Diego');
    expect(formatAuditValue('67981260005')).toBe('67981260005');
  });
});
