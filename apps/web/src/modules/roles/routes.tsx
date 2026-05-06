import { ShieldAlert } from 'lucide-react';
import type { AppRoute } from '@/routes';
import { paths } from '@/lib/paths';
import { Module } from '@/lib/permissions';
import { RequirePermission } from '@/components/RequirePermission';
import RolesPage from '@/modules/roles/RolesPage';

export const rolesRouteChildren: AppRoute[] = [
  {
    path: paths.roles,
    element: (
      <RequirePermission module={Module.Roles}>
        <RolesPage />
      </RequirePermission>
    ),
    layout: 'app',
    label: 'Cargos',
    icon: ShieldAlert,
    module: Module.Roles
  }
];
