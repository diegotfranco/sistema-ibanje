import { FileText } from 'lucide-react';
import { Module, Action } from '@/lib/permissions';
import { RequirePermission } from '@/components/RequirePermission';
import { paths } from '@/lib/paths';
import type { AppRoute } from '@/routes';

import MembershipLettersPage from './MembershipLettersPage';

export const membershipLettersRouteChildren: AppRoute[] = [
  {
    layout: 'app',
    path: paths.membershipLetters,
    element: (
      <RequirePermission module={Module.MembershipLetters} action={Action.View}>
        <MembershipLettersPage />
      </RequirePermission>
    ),
    label: 'Cartas de Transferência',
    icon: FileText
  }
];
