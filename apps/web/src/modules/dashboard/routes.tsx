import { Home } from 'lucide-react';
import type { AppRoute } from '@/routes';
import { paths } from '@/lib/paths';
import { Module } from '@/lib/permissions';
import DashboardPage from '@/modules/dashboard/DashboardPage';

export const dashboardRoutes: AppRoute[] = [
  {
    path: paths.dashboard,
    element: <DashboardPage />,
    layout: 'app',
    label: 'Início',
    icon: Home,
    module: Module.Dashboard
  }
];
