import type { Route } from '@/types/routes.types';
import RoutesEnum from '@/enums/routes.enum';
import Home from '@/pages/Home';
import Dashboard from '@/pages/Dashboard';
import Entradas from '@/pages/Entradas';
import Saidas from '@/pages/Saidas';
import Login from '@/pages/Login';
import Cadastro from '@/pages/Cadastro';
import Unauthorized from '@/pages/Unauthorized';

export const routes: Route[] = [
  {
    index: true,
    element: <Home />,
    name: 'Home',
    hasMenu: true,
    isProtected: true,
    isVisible: true,
    permission: 'home'
  },
  {
    path: RoutesEnum.DASHBOARD,
    element: <Dashboard />,
    name: 'Dashboard',
    hasMenu: true,
    isProtected: true,
    isVisible: true,
    permission: 'dashboard'
  },
  {
    path: RoutesEnum.ENTRADAS,
    element: <Entradas />,
    name: 'Entradas',
    hasMenu: true,
    isProtected: true,
    isVisible: true,
    permission: 'entradas'
  },
  {
    path: RoutesEnum.SAIDAS,
    element: <Saidas />,
    name: 'Saídas',
    hasMenu: true,
    isProtected: true,
    isVisible: true,
    permission: 'saidas'
  },
  {
    path: RoutesEnum.LOGIN,
    element: <Login />,
    name: 'Login',
    hasMenu: false,
    isProtected: false,
    isVisible: false
  },
  {
    path: RoutesEnum.CADASTRO,
    element: <Cadastro />,
    name: 'Cadastro',
    hasMenu: false,
    isProtected: false,
    isVisible: false
  },
  {
    path: RoutesEnum.UNAUTHORIZED,
    element: <Unauthorized />,
    name: 'Não Autorizado',
    hasMenu: false,
    isProtected: true,
    isVisible: false
  }
];
