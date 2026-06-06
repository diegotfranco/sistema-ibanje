import { describe, it, expect } from 'vitest';
import { paths } from './paths';

// paths is the single source of truth for route URLs shared by the router tree and the sidebar.
// These assertions pin the contract so a typo or accidental rename surfaces in CI.
describe('paths', () => {
  it('exposes absolute, slash-prefixed URLs', () => {
    for (const value of Object.values(paths)) {
      expect(value.startsWith('/')).toBe(true);
    }
  });

  it('keeps detail routes parameterized under their list route', () => {
    expect(paths.attenderDetail).toBe('/attenders/:id');
    expect(paths.attenderDetail.startsWith(paths.attenders)).toBe(true);
    expect(paths.monthlyClosingDetail.startsWith(paths.monthlyClosings)).toBe(true);
    expect(paths.minuteDetail.startsWith(paths.minutes)).toBe(true);
  });

  it('has no duplicate URLs', () => {
    const values = Object.values(paths);
    expect(new Set(values).size).toBe(values.length);
  });
});
