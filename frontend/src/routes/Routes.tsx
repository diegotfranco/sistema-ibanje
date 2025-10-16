import {
  AiOutlineHome,
  AiOutlineUsergroupAdd,
  AiOutlineFileText,
  AiOutlineDollarCircle,
  AiOutlineProfile,
  AiOutlineGold,
  AiOutlineVerticalAlignBottom,
  AiOutlineToTop,
  AiOutlineProject,
  AiOutlineProduct
} from 'react-icons/ai';
import { Outlet } from 'react-router';
import type { Route } from '@/types/routes.types';
import { ACAO, AREA } from '@/enums/permissionEnum';
import RoutesEnum from '@/enums/routesEnum';

import ExtratoEntradas from '@/pages/Entradas/ExtratoEntradas';
import LancamentosEntradas from '@/pages/Entradas/LancamentosEntradas';
import Origens from '@/pages/Entradas/Origens';
import ExtratoSaidas from '@/pages/Saidas/ExtratoSaidas';
import LancamentosSaidas from '@/pages/Saidas/LancamentosSaidas';
import Destinos from '@/pages/Saidas/Destinos';
import Extrato from '@/pages/Extrato';
import FormasPagamento from '@/pages/FormasPagamento';

import Membros from '@/pages/Membros';
import Cargos from '@/pages/Cargos';
import Permissoes from '@/pages/Permissoes';

import Areas from '@/pages/Areas';
import Status from '@/pages/Status';

import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import Cadastro from '@/pages/Cadastro';
import Unauthorized from '@/pages/Unauthorized';

export const routes: Route[] = [
  // === PROTECTED ROUTES ===

  // Group Inicio
  {
    index: true,
    element: <Dashboard />,
    icon: <AiOutlineHome />,
    name: 'Inicio',
    hasMenu: true,
    isVisible: true,
    group: 'Início',
    permission: { area: AREA.DASHBOARD, acao: ACAO.VISUALIZAR }
  },

  // Group Financeiro
  {
    ...RoutesEnum.ENTRADAS,
    icon: <AiOutlineVerticalAlignBottom className="-rotate-90" />,
    name: 'Entradas',
    element: <Outlet />,
    hasMenu: true,
    isVisible: true,
    group: 'Financeiro',
    children: [
      {
        ...RoutesEnum.EXTRATO_ENTRADAS,
        element: <ExtratoEntradas />,
        name: 'Extrato',
        permission: { area: AREA.MOVIMENTACOES_ENTRADAS, acao: ACAO.EXPORTAR }
      },
      {
        ...RoutesEnum.LANCAMENTOS_ENTRADAS,
        element: <LancamentosEntradas />,
        name: 'Lançamentos',
        hasMenu: true,
        isVisible: true,
        permission: { area: AREA.MOVIMENTACOES_ENTRADAS, acao: ACAO.VISUALIZAR }
      },
      {
        ...RoutesEnum.ORIGENS_ENTRADAS,
        element: <Origens />,
        name: 'Origens',
        hasMenu: true,
        isVisible: true,
        permission: { area: AREA.ENTRADAS, acao: ACAO.VISUALIZAR }
      }
    ]
  },
  {
    ...RoutesEnum.SAIDAS,
    icon: <AiOutlineToTop className="-rotate-90" />,
    element: <Outlet />,
    name: 'Saídas',
    hasMenu: true,
    isVisible: true,
    group: 'Financeiro',
    children: [
      {
        ...RoutesEnum.EXTRATO_SAIDAS,
        element: <ExtratoSaidas />,
        name: 'Extrato',
        permission: { area: AREA.MOVIMENTACOES_SAIDAS, acao: ACAO.EXPORTAR }
      },
      {
        ...RoutesEnum.LANCAMENTOS_SAIDAS,
        element: <LancamentosSaidas />,
        name: 'Lançamentos',
        hasMenu: true,
        isVisible: true,
        permission: { area: AREA.MOVIMENTACOES_SAIDAS, acao: ACAO.CRIAR }
      },
      {
        ...RoutesEnum.DESTINOS_SAIDAS,
        element: <Destinos />,
        name: 'Destinos',
        hasMenu: true,
        isVisible: true,
        permission: { area: AREA.SAIDAS, acao: ACAO.VISUALIZAR }
      }
    ]
  },
  {
    ...RoutesEnum.EXTRATO,
    icon: <AiOutlineFileText />,
    element: <Extrato />,
    name: 'Extratos',
    hasMenu: true,
    isVisible: true,
    group: 'Financeiro',
    permission: { area: AREA.EXTRATO, acao: ACAO.VISUALIZAR }
  },
  {
    ...RoutesEnum.FORMAS_PAGAMENTOS,
    icon: <AiOutlineDollarCircle />,
    element: <FormasPagamento />,
    name: 'Formas de Pagamento',
    hasMenu: true,
    isVisible: true,
    group: 'Financeiro',
    permission: { area: AREA.FORMAS_PAGAMENTO, acao: ACAO.VISUALIZAR }
  },

  // Group Perfis
  {
    ...RoutesEnum.MEMBROS,
    icon: <AiOutlineUsergroupAdd />,
    element: <Membros />,
    name: 'Membros',
    hasMenu: true,
    isVisible: true,
    group: 'Perfis',
    permission: { area: AREA.MEMBROS, acao: ACAO.VISUALIZAR }
  },
  {
    ...RoutesEnum.CARGOS,
    icon: <AiOutlineGold />,
    element: <Cargos />,
    name: 'Cargos',
    hasMenu: true,
    isVisible: true,
    group: 'Perfis',
    permission: { area: AREA.CARGOS, acao: ACAO.VISUALIZAR }
  },
  {
    ...RoutesEnum.PERMISSOES,
    icon: <AiOutlineProfile />,
    element: <Permissoes />,
    name: 'Permissões',
    hasMenu: true,
    isVisible: true,
    group: 'Perfis',
    permission: { area: AREA.PERMISSOES, acao: ACAO.VISUALIZAR }
  },

  // Group Sistema
  {
    ...RoutesEnum.AREAS,
    icon: <AiOutlineProduct />,
    element: <Areas />,
    name: 'Áreas',
    hasMenu: true,
    isVisible: true,
    group: 'Sistema',
    permission: { area: AREA.AREAS, acao: ACAO.VISUALIZAR }
  },
  {
    ...RoutesEnum.STATUS,
    icon: <AiOutlineProject className="rotate-180" />,
    element: <Status />,
    name: 'Status',
    hasMenu: true,
    isVisible: true,
    group: 'Sistema',
    permission: { area: AREA.STATUS, acao: ACAO.VISUALIZAR }
  },

  // === PUBLIC ROUTES ===
  {
    ...RoutesEnum.LOGIN,
    element: <Login />,
    name: 'Login',
    hasMenu: false,
    isVisible: false
  },
  {
    ...RoutesEnum.CADASTRO,
    element: <Cadastro />,
    name: 'Cadastro',
    hasMenu: false,
    isVisible: false
  },

  // === ERROR/ACCESS ===
  {
    ...RoutesEnum.UNAUTHORIZED,
    element: <Unauthorized />,
    name: 'Não Autorizado',
    hasMenu: false,
    isVisible: false
  }
];
