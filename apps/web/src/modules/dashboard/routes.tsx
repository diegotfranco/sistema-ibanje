import { LayoutDashboard } from 'lucide-react';
import type { AppRoute } from '@/routes';
import { paths } from '@/lib/paths';
import DashboardPage from '@/modules/dashboard/DashboardPage';

export const dashboardRoutes: AppRoute[] = [
  {
    path: paths.dashboard,
    element: <DashboardPage />,
    layout: 'app',
    label: 'Painel',
    icon: LayoutDashboard,
    module: 'Painel'
  }
];
