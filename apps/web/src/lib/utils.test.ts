import { describe, it, expect } from 'vitest';
import { cn } from './utils';

// cn merges clsx conditional classes and dedupes conflicting Tailwind utilities via twMerge.
describe('cn', () => {
  it('joins truthy class values and drops falsy ones', () => {
    expect(cn('a', false && 'b', undefined, 'c')).toBe('a c');
  });

  it('lets a later Tailwind utility win over an earlier conflicting one', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('supports object and array syntax', () => {
    expect(cn(['a', { b: true, c: false }])).toBe('a b');
  });
});
