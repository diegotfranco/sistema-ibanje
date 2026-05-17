import type { ReactElement } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { Module, Action } from '@/lib/permissions';
import { authRoutes } from '@/modules/auth/routes';
import { dashboardRoutes } from '@/modules/dashboard/routes';
import { attendersRoutes } from '@/modules/attenders/routes';
import { financeRoutes } from '@/modules/finance/routes';
import { rolesRouteChildren } from '@/modules/roles/routes';
import { usersRouteChildren } from '@/modules/users/routes';
import { churchSettingsRouteChildren } from '@/modules/church-settings/routes';
import { pautasRouteChildren } from '@/modules/meetings/routes';
import { atasRouteChildren } from '@/modules/minutes/routes';
import { minuteTemplatesRouteChildren } from '@/modules/minute-templates/routes';
import { meRoutes } from '@/modules/me/routes';
import { membershipLettersRouteChildren } from '@/modules/membership-letters/routes';

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

const configuracoesSection: AppRoute = {
  layout: 'app',
  label: 'Configurações',
  children: [
    ...rolesRouteChildren,
    ...usersRouteChildren,
    ...churchSettingsRouteChildren,
    ...minuteTemplatesRouteChildren
  ]
};

const secretariaSection: AppRoute = {
  layout: 'app',
  label: 'Secretaria',
  children: [
    ...(attendersRoutes[0].children ?? []),
    ...pautasRouteChildren,
    ...atasRouteChildren,
    ...membershipLettersRouteChildren
  ]
};

export const appRoutes: AppRoute[] = [
  ...authRoutes,
  ...dashboardRoutes,
  configuracoesSection,
  ...financeRoutes,
  secretariaSection,
  ...meRoutes
];
