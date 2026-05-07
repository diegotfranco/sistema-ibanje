import { ClipboardList } from 'lucide-react';
import type { AppRoute } from '@/routes';
import { paths } from '@/lib/paths';
import { Module } from '@/lib/permissions';
import { RequirePermission } from '@/components/RequirePermission';
import PautasPage from '@/modules/pautas/PautasPage';

export const pautasRouteChildren: AppRoute[] = [
  {
    path: paths.boardMeetings,
    element: (
      <RequirePermission module={Module.Agendas}>
        <PautasPage />
      </RequirePermission>
    ),
    layout: 'app',
    label: 'Pautas',
    icon: ClipboardList,
    module: Module.Agendas
  }
];
