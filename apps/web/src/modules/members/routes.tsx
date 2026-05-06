import { Users } from 'lucide-react';
import type { AppRoute } from '@/routes';
import { paths } from '@/lib/paths';
import { Module } from '@/lib/permissions';
import { RequirePermission } from '@/components/RequirePermission';
import MembersPage from '@/modules/members/MembersPage';

export const membersRoutes: AppRoute[] = [
  {
    layout: 'app',
    label: 'Membros',
    children: [
      {
        path: paths.members,
        element: (
          <RequirePermission module={Module.Members}>
            <MembersPage />
          </RequirePermission>
        ),
        layout: 'app',
        label: 'Membros',
        icon: Users,
        module: Module.Members
      }
    ]
  }
];
