import { Building2 } from 'lucide-react';
import type { AppRoute } from '@/routes';
import { paths } from '@/lib/paths';
import { Module } from '@/lib/permissions';
import { RequirePermission } from '@/components/RequirePermission';
import ChurchSettingsPage from './ChurchSettingsPage';

export const churchSettingsRouteChildren: AppRoute[] = [
  {
    path: paths.churchSettings,
    element: (
      <RequirePermission module={Module.ChurchSettings}>
        <ChurchSettingsPage />
      </RequirePermission>
    ),
    layout: 'app',
    label: 'Configurações da Igreja',
    icon: Building2,
    module: Module.ChurchSettings
  }
];
