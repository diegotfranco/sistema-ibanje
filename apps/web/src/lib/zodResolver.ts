// @hookform/resolvers v5.2.2 was built against Zod 4.0.x and fails the
// _zod.version.minor type check with Zod 4.4.x. Casting _zodResolver itself
// bypasses overload resolution so the version mismatch never surfaces.
import { zodResolver as _zodResolver } from '@hookform/resolvers/zod';
import type { Resolver, FieldValues } from 'react-hook-form';
import type { ZodSchema } from 'zod';

type ZodResolverFn = <T extends FieldValues>(schema: ZodSchema<unknown>) => Resolver<T>;

export function zodResolver<T extends FieldValues>(schema: ZodSchema<unknown>): Resolver<T> {
  return (_zodResolver as unknown as ZodResolverFn)(schema);
}
