import { CreditCard } from 'lucide-react';
import type { AppRoute } from '@/routes';
import { paths } from '@/lib/paths';
import { Module } from '@/lib/permissions';
import { RequirePermission } from '@/components/RequirePermission';
import PaymentMethodsPage from './PaymentMethodsPage';

// Payment methods are reference/config data, so the menu entry lives under Configurações even
// though the code stays in the finance module folder.
export const paymentMethodsRouteChildren: AppRoute[] = [
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
];
