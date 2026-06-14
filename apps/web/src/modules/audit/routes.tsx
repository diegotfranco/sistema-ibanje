import { ScrollText } from 'lucide-react';
import type { AppRoute } from '@/routes';
import { paths } from '@/lib/paths';
import { Module } from '@/lib/permissions';
import { RequirePermission } from '@/components/RequirePermission';
import AuditPage from './AuditPage';

// Gated by the dedicated Auditoria module (admin-only by seed — same gate as the backend).
export const auditRouteChildren: AppRoute[] = [
  {
    path: paths.audit,
    element: (
      <RequirePermission module={Module.Audit}>
        <AuditPage />
      </RequirePermission>
    ),
    layout: 'app',
    label: 'Auditoria',
    icon: ScrollText,
    module: Module.Audit
  }
];
