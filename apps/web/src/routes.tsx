import type { ReactElement } from 'react';
import type { LucideIcon } from 'lucide-react';
import { authRoutes } from '@/modules/auth/routes';
import { dashboardRoutes } from '@/modules/dashboard/routes';

export type AppRoute = {
  path: string;
  element: ReactElement;
  layout: 'auth' | 'app';
  label?: string;
  icon?: LucideIcon;
  module?: string;
  action?: string;
  children?: AppRoute[];
};

export const appRoutes: AppRoute[] = [...authRoutes, ...dashboardRoutes];
