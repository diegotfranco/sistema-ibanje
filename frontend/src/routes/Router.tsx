import { createBrowserRouter } from 'react-router';
import { routes } from './Routes';
import { resolveLayout } from './layouts/layoutResolver';
import Error from '@/pages/Error';
import routesEnum from '@/enums/routes.enum';

const routesWithLayout = routes.map((route) => ({
  ...route,
  element: resolveLayout(route)
}));

export const router = createBrowserRouter(
  [
    {
      ...routesEnum.ROOT,
      errorElement: <Error />,
      children: routesWithLayout
    }
  ],
  {
    // 👉 Use /sistema-ibanje in production, but / in development
    basename: import.meta.env.PROD ? '/sistema-ibanje' : '/'
  }
);
