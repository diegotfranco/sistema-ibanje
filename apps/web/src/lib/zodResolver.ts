// @hookform/resolvers v5.2.2 was built against Zod 4.0.x and fails the
// _zod.version.minor type check with Zod 4.4.x. Casting _zodResolver itself
// bypasses overload resolution so the version mismatch never surfaces.
import { zodResolver as _zodResolver } from '@hookform/resolvers/zod';
import type { Resolver, FieldValues } from 'react-hook-form';

export function zodResolver<T extends FieldValues>(schema: object): Resolver<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (_zodResolver as any)(schema) as Resolver<T>;
}
