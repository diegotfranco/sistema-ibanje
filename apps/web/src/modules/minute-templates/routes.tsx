import { FileCode2 } from 'lucide-react';
import type { AppRoute } from '@/routes';
import { paths } from '@/lib/paths';
import { Module } from '@/lib/permissions';
import { RequirePermission } from '@/components/RequirePermission';
import MinuteTemplatesPage from '@/modules/minute-templates/MinuteTemplatesPage';

export const minuteTemplatesRouteChildren: AppRoute[] = [
  {
    path: paths.minuteTemplates,
    element: (
      <RequirePermission module={Module.MinuteTemplates}>
        <MinuteTemplatesPage />
      </RequirePermission>
    ),
    layout: 'app',
    label: 'Modelos de Ata',
    icon: FileCode2,
    module: Module.MinuteTemplates
  }
];
