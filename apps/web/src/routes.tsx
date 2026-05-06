import type { ReactElement } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { Module, Action } from '@/lib/permissions';
import { authRoutes } from '@/modules/auth/routes';
import { dashboardRoutes } from '@/modules/dashboard/routes';
import { financeRoutes } from '@/modules/finance/routes';

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

export const appRoutes: AppRoute[] = [...authRoutes, ...dashboardRoutes, ...financeRoutes];
