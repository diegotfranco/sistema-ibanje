import { CalendarDays } from 'lucide-react';
import type { AppRoute } from '@/routes';
import { paths } from '@/lib/paths';
import { Module } from '@/lib/permissions';
import { RequirePermission } from '@/components/RequirePermission';
import CalendarPage from '@/modules/calendar/CalendarPage';

export const calendarRouteChildren: AppRoute[] = [
  {
    path: paths.calendar,
    element: (
      <RequirePermission module={Module.SecretaryCalendar}>
        <CalendarPage />
      </RequirePermission>
    ),
    layout: 'app',
    label: 'Calendário',
    icon: CalendarDays,
    module: Module.SecretaryCalendar
  }
];
