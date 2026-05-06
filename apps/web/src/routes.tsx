import type { ReactElement } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { Module, Action } from '@/lib/permissions';
import { authRoutes } from '@/modules/auth/routes';
import { dashboardRoutes } from '@/modules/dashboard/routes';
import { membersRoutes } from '@/modules/members/routes';
import { financeRoutes } from '@/modules/finance/routes';
import { rolesRouteChildren } from '@/modules/roles/routes';
import { usersRouteChildren } from '@/modules/users/routes';

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

export const appRoutes: AppRoute[] = [
  ...authRoutes,
  ...dashboardRoutes,
  adminSection,
  ...membersRoutes,
  ...financeRoutes
];
