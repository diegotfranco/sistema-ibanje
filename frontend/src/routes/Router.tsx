import { createBrowserRouter } from 'react-router';
import { routes } from './Routes';
import { resolveLayout } from './layouts/layoutResolver';
import { Root } from './Root';
import Error from '@/pages/Error';
import RoutesEnum from '@/enums/routesEnum';

const routesWithLayout = routes.map((route) => ({
  ...route,
  element: resolveLayout(route, routes)
}));

export const router = createBrowserRouter(
  [
    {
      path: RoutesEnum.ROOT,
      element: <Root />,
      errorElement: <Error />,
      children: routesWithLayout
    }
  ],
  {
    // 👉 Use /sistema-ibanje in production, but / in development
    basename: import.meta.env.PROD ? '/sistema-ibanje' : '/'
  }
);
