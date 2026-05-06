import { CreditCard, FolderTree, PiggyBank, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import type { AppRoute } from '@/routes';
import { paths } from '@/lib/paths';
import { Module } from '@/lib/permissions';
import { RequirePermission } from '@/components/RequirePermission';
import IncomeEntriesPage from '@/modules/finance/income-entries/IncomeEntriesPage';
import ExpenseEntriesPage from '@/modules/finance/expense-entries/ExpenseEntriesPage';
import PaymentMethodsPage from '@/modules/finance/payment-methods/PaymentMethodsPage';
import DesignatedFundsPage from '@/modules/finance/designated-funds/DesignatedFundsPage';
import IncomeCategoriesPage from '@/modules/finance/income-categories/IncomeCategoriesPage';
import ExpenseCategoriesPage from '@/modules/finance/expense-categories/ExpenseCategoriesPage';

export const financeRoutes: AppRoute[] = [
  {
    layout: 'app',
    label: 'Financeiro',
    children: [
      {
        path: paths.incomeEntries,
        element: (
          <RequirePermission module={Module.IncomeEntries}>
            <IncomeEntriesPage />
          </RequirePermission>
        ),
        layout: 'app',
        label: 'Lançamentos de Entradas',
        icon: TrendingUp,
        module: Module.IncomeEntries
      },
      {
        path: paths.expenseEntries,
        element: (
          <RequirePermission module={Module.ExpenseEntries}>
            <ExpenseEntriesPage />
          </RequirePermission>
        ),
        layout: 'app',
        label: 'Lançamentos de Saídas',
        icon: TrendingDown,
        module: Module.ExpenseEntries
      },
      {
        path: paths.incomeCategories,
        element: (
          <RequirePermission module={Module.IncomeCategories}>
            <IncomeCategoriesPage />
          </RequirePermission>
        ),
        layout: 'app',
        label: 'Categorias de Entradas',
        icon: Wallet,
        module: Module.IncomeCategories
      },
      {
        path: paths.expenseCategories,
        element: (
          <RequirePermission module={Module.ExpenseCategories}>
            <ExpenseCategoriesPage />
          </RequirePermission>
        ),
        layout: 'app',
        label: 'Categorias de Saídas',
        icon: FolderTree,
        module: Module.ExpenseCategories
      },
      {
        path: paths.paymentMethods,
        element: (
          <RequirePermission module={Module.PaymentMethods}>
            <PaymentMethodsPage />
          </RequirePermission>
        ),
        layout: 'app',
        label: 'Formas de Pagamento',
        icon: CreditCard,
        module: Module.PaymentMethods
      },
      {
        path: paths.designatedFunds,
        element: (
          <RequirePermission module={Module.DesignatedFunds}>
            <DesignatedFundsPage />
          </RequirePermission>
        ),
        layout: 'app',
        label: 'Fundos Designados',
        icon: PiggyBank,
        module: Module.DesignatedFunds
      }
    ]
  }
];
