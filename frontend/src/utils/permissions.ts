import type { User } from '@/types/auth.types';

/**
 * Checks if the user has a specific permission.
 */
export function hasPermission(user: User | null | undefined, area: number, acao: number): boolean {
  if (!user || !Array.isArray(user.permissions)) return false;

  const entry = user.permissions.find(([areaId]) => areaId === area);
  if (!entry) return false;

  const [, actions] = entry;
  return actions.includes(acao);
}
