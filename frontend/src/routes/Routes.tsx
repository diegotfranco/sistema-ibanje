import Dashboard from '@/pages/Dashboard';
import Entradas from '@/pages/Entradas';
import Saidas from '@/pages/Saidas';
import Login from '@/pages/Login';
import Cadastro from '@/pages/Cadastro';
import Unauthorized from '@/pages/Unauthorized';
import RoutesEnum from '@/enums/routesEnum';
import { ACAO, AREA } from '@/enums/permissionEnum';
import type { Route } from '@/types/routes.types';
import Membros from '@/pages/Membros';

export const routes: Route[] = [
  // === PROTECTED ROUTES ===
  {
    index: true,
    // path: RoutesEnum.DASHBOARD,
    element: <Dashboard />,
    name: 'Dashboard',
    hasMenu: true,
    isVisible: true,
    permission: { area: AREA.DASHBOARD, acao: ACAO.VISUALIZAR }
  },
  {
    path: RoutesEnum.ENTRADAS,
    element: <Entradas />,
    name: 'Entradas',
    hasMenu: true,
    isVisible: true,
    permission: { area: AREA.MOVIMENTACOES_ENTRADAS, acao: ACAO.VISUALIZAR }
  },
  {
    path: RoutesEnum.SAIDAS,
    element: <Saidas />,
    name: 'Saídas',
    hasMenu: true,
    isVisible: true,
    permission: { area: AREA.MOVIMENTACOES_SAIDAS, acao: ACAO.VISUALIZAR }
  },
  {
    path: RoutesEnum.MEMBROS,
    element: <Membros />,
    name: 'Membros',
    hasMenu: true,
    isVisible: true,
    permission: { area: AREA.MEMBROS, acao: ACAO.VISUALIZAR }
  },

  // === PUBLIC ROUTES ===
  {
    path: RoutesEnum.LOGIN,
    element: <Login />,
    name: 'Login',
    hasMenu: false,
    isVisible: false
  },
  {
    path: RoutesEnum.CADASTRO,
    element: <Cadastro />,
    name: 'Cadastro',
    hasMenu: false,
    isVisible: false
  },

  // === ERROR/ACCESS ===
  {
    path: RoutesEnum.UNAUTHORIZED,
    element: <Unauthorized />,
    name: 'Não Autorizado',
    hasMenu: false,
    isVisible: false
  }
];
