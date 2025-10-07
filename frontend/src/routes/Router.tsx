import { createBrowserRouter } from 'react-router';
import { resolveLayout } from './layouts/layoutResolver';
import { routes } from './Routes';
import { Root } from './Root';
import Error from 'pages/Error';

const routesWithLayouts = routes.map((route) => ({
  ...route,
  element: resolveLayout(route, routes)
}));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    errorElement: <Error />,
    children: routesWithLayouts
  }
]);
