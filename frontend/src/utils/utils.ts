import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { User } from '@/types/auth.types';
import { type AreaKey, type AcaoKey, AREA, ACAO } from '@/enums/permissionEnum';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

/**
 * A type-safe wrapper that lets you use string keys (e.g. "USUARIOS", "EDITAR").
 */
export function can(user: User | null | undefined, areaKey: AreaKey, acaoKey: AcaoKey): boolean {
  const areaId = AREA[areaKey];
  const acaoId = ACAO[acaoKey];
  return hasPermission(user, areaId, acaoId);
}
