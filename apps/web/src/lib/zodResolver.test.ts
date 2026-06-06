import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { zodResolver } from './zodResolver';

// Thin wrapper around @hookform/resolvers that side-steps a Zod 4.4 version-check type error.
// We just need to confirm it produces a working react-hook-form Resolver.
describe('zodResolver', () => {
  const schema = z.object({ name: z.string().min(2) });

  it('returns a resolver function', () => {
    expect(typeof zodResolver(schema)).toBe('function');
  });

  it('resolves valid values with no errors', async () => {
    const resolver = zodResolver(schema);
    const result = await resolver({ name: 'Ana' }, undefined, {
      fields: {},
      shouldUseNativeValidation: false
    });
    expect(result.errors).toEqual({});
    expect(result.values).toEqual({ name: 'Ana' });
  });

  it('surfaces field errors for invalid values', async () => {
    const resolver = zodResolver(schema);
    const result = await resolver({ name: 'A' }, undefined, {
      fields: {},
      shouldUseNativeValidation: false
    });
    expect(result.errors).toHaveProperty('name');
  });
});
