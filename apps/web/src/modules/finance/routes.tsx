import { CreditCard, FileBarChart, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react';
import type { AppRoute } from '@/routes';
import { paths } from '@/lib/paths';
import { Module, Action } from '@/lib/permissions';
import { RequirePermission } from '@/components/RequirePermission';
import IncomeEntriesPage from '@/modules/finance/income-entries/IncomeEntriesPage';
import ExpenseEntriesPage from '@/modules/finance/expense-entries/ExpenseEntriesPage';
import MonthlyClosingDetailPage from '@/modules/finance/monthly-closings/MonthlyClosingDetailPage';
import PaymentMethodsPage from '@/modules/finance/payment-methods/PaymentMethodsPage';
import DesignatedFundsPage from '@/modules/finance/designated-funds/DesignatedFundsPage';
import IncomeCategoriesPage from '@/modules/finance/income-categories/IncomeCategoriesPage';
import ExpenseCategoriesPage from '@/modules/finance/expense-categories/ExpenseCategoriesPage';
import ReportsPage from '@/modules/finance/reports/ReportsPage';

export const financeRoutes: AppRoute[] = [
  {
    layout: 'app',
    label: 'Financeiro',
    children: [
      {
        layout: 'app',
        label: 'Entradas',
        icon: TrendingUp,
        children: [
          {
            path: paths.incomeEntries,
            element: (
              <RequirePermission module={Module.IncomeEntries}>
                <IncomeEntriesPage />
              </RequirePermission>
            ),
            layout: 'app',
            label: 'Lançamentos',
            module: Module.IncomeEntries
          },
          {
            path: paths.incomeCategories,
            element: (
              <RequirePermission module={Module.IncomeCategories}>
                <IncomeCategoriesPage />
              </RequirePermission>
            ),
            layout: 'app',
            label: 'Categorias',
            module: Module.IncomeCategories
          },
          {
            path: `${paths.reports}?tab=income`,
            layout: 'app',
            label: 'Relatório',
            module: Module.Reports,
            action: Action.Report
          }
        ]
      },
      {
        layout: 'app',
        label: 'Saídas',
        icon: TrendingDown,
        children: [
          {
            path: paths.expenseEntries,
            element: (
              <RequirePermission module={Module.ExpenseEntries}>
                <ExpenseEntriesPage />
              </RequirePermission>
            ),
            layout: 'app',
            label: 'Lançamentos',
            module: Module.ExpenseEntries
          },
          {
            path: paths.expenseCategories,
            element: (
              <RequirePermission module={Module.ExpenseCategories}>
                <ExpenseCategoriesPage />
              </RequirePermission>
            ),
            layout: 'app',
            label: 'Categorias',
            module: Module.ExpenseCategories
          },
          {
            path: `${paths.reports}?tab=expenses`,
            layout: 'app',
            label: 'Relatório',
            module: Module.Reports,
            action: Action.Report
          }
        ]
      },
      {
        layout: 'app',
        label: 'Relatórios',
        icon: FileBarChart,
        children: [
          {
            path: `${paths.reports}?tab=statement`,
            layout: 'app',
            label: 'Demonstrativo',
            module: Module.Reports,
            action: Action.Report
          },
          {
            path: paths.monthlyClosingDetail,
            element: (
              <RequirePermission module={Module.MonthlyClosings}>
                <MonthlyClosingDetailPage />
              </RequirePermission>
            ),
            layout: 'app',
            label: 'Fechamentos Mensais',
            module: Module.MonthlyClosings
          }
        ]
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
      }
    ]
  },
  {
    path: paths.reports,
    element: (
      <RequirePermission module={Module.Reports} action={Action.Report}>
        <ReportsPage />
      </RequirePermission>
    ),
    layout: 'app',
    module: Module.Reports,
    action: Action.Report
  }
];
