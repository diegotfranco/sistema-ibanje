import type { ReactElement } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { Module, Action } from '@/lib/permissions';
import { authRoutes } from '@/modules/auth/routes';
import { dashboardRoutes } from '@/modules/dashboard/routes';
import { attendersRoutes } from '@/modules/attenders/routes';
import { financeRoutes } from '@/modules/finance/routes';
import { rolesRouteChildren } from '@/modules/roles/routes';
import { usersRouteChildren } from '@/modules/users/routes';
import { pautasRouteChildren } from '@/modules/meetings/routes';
import { atasRouteChildren } from '@/modules/minutes/routes';

export type AppRoute = {
  // Section parents (with children) may omit path/element; only leaves render as routes.
  path?: string;
  element?: ReactElement;
  layout: 'auth' | 'app';
  label?: string;
  icon?: LucideIcon;
  module?: Module;
  action?: Action;
  children?: AppRoute[];
};

const adminSection: AppRoute = {
  layout: 'app',
  label: 'Administração',
  children: [...rolesRouteChildren, ...usersRouteChildren]
};

const secretariaSection: AppRoute = {
  layout: 'app',
  label: 'Secretaria',
  children: [...pautasRouteChildren, ...atasRouteChildren]
};

export const appRoutes: AppRoute[] = [
  ...authRoutes,
  ...dashboardRoutes,
  adminSection,
  ...attendersRoutes,
  ...financeRoutes,
  secretariaSection
];
