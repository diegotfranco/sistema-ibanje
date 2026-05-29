import { Users } from 'lucide-react';
import type { AppRoute } from '@/routes';
import { paths } from '@/lib/paths';
import { Module } from '@/lib/permissions';
import { RequirePermission } from '@/components/RequirePermission';
import AttendersPage from '@/modules/attenders/AttendersPage';
import AttenderDetailPage from '@/modules/attenders/AttenderDetailPage';

export const attendersRoutes: AppRoute[] = [
  {
    layout: 'app',
    label: 'Congregados',
    children: [
      {
        path: paths.attenders,
        element: (
          <RequirePermission module={Module.Attenders}>
            <AttendersPage />
          </RequirePermission>
        ),
        layout: 'app',
        label: 'Congregados',
        icon: Users,
        module: Module.Attenders
      },
      {
        path: paths.attenderDetail,
        element: (
          <RequirePermission module={Module.Attenders}>
            <AttenderDetailPage />
          </RequirePermission>
        ),
        layout: 'app'
      }
    ]
  }
];
