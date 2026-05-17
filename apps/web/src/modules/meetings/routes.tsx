import { ClipboardList } from 'lucide-react';
import type { AppRoute } from '@/routes';
import { paths } from '@/lib/paths';
import { Module } from '@/lib/permissions';
import { RequirePermission } from '@/components/RequirePermission';
import PautasPage from '@/modules/meetings/MeetingsPage';

export const pautasRouteChildren: AppRoute[] = [
  {
    path: paths.meetings,
    element: (
      <RequirePermission module={Module.Agendas}>
        <PautasPage />
      </RequirePermission>
    ),
    layout: 'app',
    label: 'Assembleias',
    icon: ClipboardList,
    module: Module.Agendas
  }
];
