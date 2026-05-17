import { paths } from '@/lib/paths';
import MePage from './MePage';
import type { AppRoute } from '@/routes';

export const meRoutes: AppRoute[] = [
  {
    path: paths.me,
    element: <MePage />,
    layout: 'app'
  }
];
