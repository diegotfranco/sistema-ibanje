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
  AiOutlineProduct,
  AiOutlineBarChart
} from 'react-icons/ai';
import { Outlet } from 'react-router';
import type { Route } from '@/types/routes.types';
import { module, action } from '@/enums/permission.enum';
import routesEnum from '@/enums/routes.enum';

import ExtratoEntradas from '@/pages/Income/IncomeOverview';
import LancamentosEntradas from '@/pages/Income/IncomeEntries';
import Origens from '@/pages/Income/IncomeCategories';
import ExtratoSaidas from '@/pages/Expenses/ExpenseOverview';
import LancamentosSaidas from '@/pages/Expenses/ExpenseEntries';
import Destinos from '@/pages/Expenses/ExpenseCategories';
import Extrato from '@/pages/Reports';
import FormasPagamento from '@/pages/PaymentMethod';

import Membros from '@/pages/Members';
import Cargos from '@/pages/Roles';
import Permissoes from '@/pages/Permissions';

import Areas from '@/pages/Areas';
import Status from '@/pages/Status';

import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Auth/Login';
import Cadastro from '@/pages/Auth/Signup';
import Unauthorized from '@/pages/Unauthorized';
import ForgotPassword from '@/pages/Auth/ForgotPassword';
import ForgotPasswordEmailSent from '@/pages/Auth/ForgotPasswordEmailSent';
import ResetPassword from '@/pages/Auth/ResetPassword';
import RedirectByRole from '@/pages/RedirectByRole';

export const routes: Route[] = [
  // === PROTECTED ROUTES ===

  // Group Início
  {
    index: true,
    element: <RedirectByRole />,
    icon: <AiOutlineHome />,
    name: 'Início',
    hasMenu: true,
    isVisible: true,
    group: 'Início'
  },

  // Group Financeiro
  {
    ...routesEnum.DASHBOARD,
    element: <Dashboard />,
    icon: <AiOutlineBarChart />,
    name: 'Painel',
    hasMenu: true,
    isVisible: true,
    permission: { module: module.DASHBOARD, action: action.VIEW },
    group: 'Financeiro'
  },
  {
    ...routesEnum.INCOME,
    icon: <AiOutlineVerticalAlignBottom className="-rotate-90" />,
    name: 'Entradas',
    element: <Outlet />,
    hasMenu: true,
    isVisible: true,
    permission: { module: module.INCOME_ENTRIES, action: action.EXPORT },
    group: 'Financeiro',
    children: [
      {
        ...routesEnum.INCOME_OVERVIEW,
        element: <ExtratoEntradas />,
        name: 'Extrato'
      },
      {
        ...routesEnum.INCOME_ENTRIES,
        element: <LancamentosEntradas />,
        name: 'Lançamentos',
        hasMenu: true,
        isVisible: true,
        permission: { module: module.INCOME_ENTRIES, action: action.VIEW }
      },
      {
        ...routesEnum.INCOME_CATEGORIES,
        element: <Origens />,
        name: 'Origens',
        hasMenu: true,
        isVisible: true,
        permission: { module: module.INCOME_CATEGORIES, action: action.VIEW }
      }
    ]
  },
  {
    ...routesEnum.EXPENSES,
    icon: <AiOutlineToTop className="-rotate-90" />,
    element: <Outlet />,
    name: 'Saídas',
    hasMenu: true,
    isVisible: true,
    permission: { module: module.EXPENSE_ENTRIES, action: action.EXPORT },
    group: 'Financeiro',
    children: [
      {
        ...routesEnum.EXPENSES_OVERVIEW,
        element: <ExtratoSaidas />,
        name: 'Extrato'
      },
      {
        ...routesEnum.EXPENSES_ENTRIES,
        element: <LancamentosSaidas />,
        name: 'Lançamentos',
        hasMenu: true,
        isVisible: true,
        permission: { module: module.EXPENSE_ENTRIES, action: action.CREATE }
      },
      {
        ...routesEnum.EXPENSES_CATEGORIES,
        element: <Destinos />,
        name: 'Destinos',
        hasMenu: true,
        isVisible: true,
        permission: { module: module.EXPENSE_CATEGORIES, action: action.VIEW }
      }
    ]
  },
  {
    ...routesEnum.REPORTS,
    icon: <AiOutlineFileText />,
    element: <Extrato />,
    name: 'Extratos',
    hasMenu: true,
    isVisible: true,
    group: 'Financeiro',
    permission: { module: module.REPORTS, action: action.VIEW }
  },
  {
    ...routesEnum.PAYMENT_METHODS,
    icon: <AiOutlineDollarCircle />,
    element: <FormasPagamento />,
    name: 'Formas de Pagamento',
    hasMenu: true,
    isVisible: true,
    group: 'Financeiro',
    permission: { module: module.PAYMENT_METHODS, action: action.VIEW }
  },

  //Group Administrativo
  {
    ...routesEnum.PAUTAS,
    icon: <AiOutlineToTop className="-rotate-90" />,
    element: <Outlet />,
    name: 'Pautas',
    hasMenu: true,
    isVisible: true,
    permission: { module: module.PAUTAS, action: action.VIEW },
    group: 'Administrativo',
    children: [
      {
        ...routesEnum.PAUTAS_VIEW,
        element: <ExtratoSaidas />,
        name: 'Visualisar'
      },
      {
        ...routesEnum.PAUTAS_ENTRIES,
        element: <LancamentosSaidas />,
        name: 'Lançamentos',
        hasMenu: true,
        isVisible: true,
        permission: { module: module.PAUTAS, action: action.CREATE }
      }
    ]
  },
  {
    ...routesEnum.ATAS,
    icon: <AiOutlineToTop className="-rotate-90" />,
    element: <Outlet />,
    name: 'Atas',
    hasMenu: true,
    isVisible: true,
    permission: { module: module.ATAS, action: action.VIEW },
    group: 'Administrativo',
    children: [
      {
        ...routesEnum.ATAS_OVERVIEW,
        element: <ExtratoSaidas />,
        name: 'Resumo'
      },
      {
        ...routesEnum.ATAS_VIEW,
        element: <ExtratoSaidas />,
        name: 'Visualisar',
        hasMenu: true,
        isVisible: true,
        permission: { module: module.ATAS, action: action.VIEW }
      },
      {
        ...routesEnum.ATAS_ENTRIES,
        element: <LancamentosSaidas />,
        name: 'Lançamentos',
        hasMenu: true,
        isVisible: true,
        permission: { module: module.ATAS, action: action.CREATE }
      }
    ]
  },

  // Group Perfis
  {
    ...routesEnum.MEMBERS,
    icon: <AiOutlineUsergroupAdd />,
    element: <Membros />,
    name: 'Membros',
    hasMenu: true,
    isVisible: true,
    group: 'Perfis',
    permission: { module: module.MEMBERS, action: action.VIEW }
  },
  {
    ...routesEnum.ROLES,
    icon: <AiOutlineGold />,
    element: <Cargos />,
    name: 'Cargos',
    hasMenu: true,
    isVisible: true,
    group: 'Perfis',
    permission: { module: module.ROLES, action: action.VIEW }
  },
  {
    ...routesEnum.PERMISSIONS,
    icon: <AiOutlineProfile />,
    element: <Permissoes />,
    name: 'Permissões',
    hasMenu: true,
    isVisible: true,
    group: 'Perfis',
    permission: { module: module.PERMISSIONS, action: action.VIEW }
  },

  // Group Sistema
  {
    ...routesEnum.AREAS,
    icon: <AiOutlineProduct />,
    element: <Areas />,
    name: 'Áreas',
    hasMenu: true,
    isVisible: true,
    group: 'Sistema',
    permission: { module: module.MODULES, action: action.VIEW }
  },
  {
    ...routesEnum.STATUS,
    icon: <AiOutlineProject className="rotate-180" />,
    element: <Status />,
    name: 'Status',
    hasMenu: true,
    isVisible: true,
    group: 'Sistema',
    permission: { module: module.STATUS, action: action.VIEW }
  },

  // === PUBLIC ROUTES ===
  {
    ...routesEnum.LOGIN,
    element: <Login />,
    name: 'Login',
    hasMenu: false,
    isVisible: false
  },
  {
    ...routesEnum.SIGNUP,
    element: <Cadastro />,
    name: 'Cadastro',
    hasMenu: false,
    isVisible: false
  },
  {
    ...routesEnum.FORGOT_PASSWORD,
    element: <ForgotPassword />,
    name: 'Esqueci minha senha',
    hasMenu: false,
    isVisible: false
  },
  {
    ...routesEnum.FORGOT_PASSWORD_EMAIL_SENT,
    element: <ForgotPasswordEmailSent />,
    name: 'Email enviado',
    hasMenu: false,
    isVisible: false
  },
  {
    ...routesEnum.RESET_PASSWORD,
    element: <ResetPassword />,
    name: 'Resetar a senha',
    hasMenu: false,
    isVisible: false
  },

  // === ERROR/ACCESS ===
  {
    ...routesEnum.UNAUTHORIZED,
    element: <Unauthorized />,
    name: 'Não Autorizado',
    hasMenu: false,
    isVisible: false
  }
];
