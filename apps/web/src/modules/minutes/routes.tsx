import { FileText } from 'lucide-react';
import type { AppRoute } from '@/routes';
import { paths } from '@/lib/paths';
import { Module } from '@/lib/permissions';
import { RequirePermission } from '@/components/RequirePermission';
import MinutesPage from '@/modules/minutes/MinutesPage';
import MinuteDetailPage from '@/modules/minutes/MinuteDetailPage';

export const atasRouteChildren: AppRoute[] = [
  {
    path: paths.minutes,
    element: (
      <RequirePermission module={Module.Minutes}>
        <MinutesPage />
      </RequirePermission>
    ),
    layout: 'app',
    label: 'Atas',
    icon: FileText,
    module: Module.Minutes
  },
  {
    path: paths.minuteDetail,
    element: (
      <RequirePermission module={Module.Minutes}>
        <MinuteDetailPage />
      </RequirePermission>
    ),
    layout: 'app',
    module: Module.Minutes
  }
];
