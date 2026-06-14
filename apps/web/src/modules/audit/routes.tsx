import { ScrollText } from 'lucide-react';
import type { AppRoute } from '@/routes';
import { paths } from '@/lib/paths';
import { Module } from '@/lib/permissions';
import { RequirePermission } from '@/components/RequirePermission';
import AuditPage from './AuditPage';

// Gated by Users (the audit trail is an admin/accountability surface — same gate as the backend).
export const auditRouteChildren: AppRoute[] = [
  {
    path: paths.audit,
    element: (
      <RequirePermission module={Module.Users}>
        <AuditPage />
      </RequirePermission>
    ),
    layout: 'app',
    label: 'Auditoria',
    icon: ScrollText,
    module: Module.Users
  }
];
