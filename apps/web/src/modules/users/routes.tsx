import { Users } from 'lucide-react';
import type { AppRoute } from '@/routes';
import { paths } from '@/lib/paths';
import { Module } from '@/lib/permissions';
import { RequirePermission } from '@/components/RequirePermission';
import UsersPage from '@/modules/users/UsersPage';

export const usersRouteChildren: AppRoute[] = [
  {
    path: paths.users,
    element: (
      <RequirePermission module={Module.Users}>
        <UsersPage />
      </RequirePermission>
    ),
    layout: 'app',
    label: 'Usuários',
    icon: Users,
    module: Module.Users
  }
];
