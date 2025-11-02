import type { User } from '@/types/auth.types';

/**
 * Checks if the user has a specific permission.
 */
export function hasPermission(user: User | null | undefined, module: number, action: number): boolean {
  if (!user || !Array.isArray(user.permissions)) return false;

  const entry = user.permissions.find(([moduleId]) => moduleId === module);
  if (!entry) return false;

  const [, actions] = entry;
  return actions.includes(action);
}
