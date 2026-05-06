import { useResourceList, useResourceMutations } from '@/lib/resourceQuery';
import type { PaymentMethodResponse, PaymentMethodFormValues } from '@/schemas/payment-method';

const BASE = '/payment-methods';
const KEY = ['payment-methods'] as const;

export function usePaymentMethods() {
  return useResourceList<PaymentMethodResponse>(BASE, KEY);
}

export function usePaymentMethodMutations() {
  return useResourceMutations<
    PaymentMethodResponse,
    PaymentMethodFormValues,
    Partial<PaymentMethodFormValues>
  >(BASE, KEY, {
    created: 'Forma de pagamento criada.',
    updated: 'Forma de pagamento atualizada.',
    removed: 'Forma de pagamento removida.'
  });
}
