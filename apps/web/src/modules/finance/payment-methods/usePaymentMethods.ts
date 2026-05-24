import { useResourceList, useResourceMutations } from '@/hooks/useResourceQuery';
import type { PaymentMethodResponse, PaymentMethodFormValues } from './schema';

const BASE = '/payment-methods';
const KEY = ['payment-methods'] as const;

export function usePaymentMethods() {
  // No paginated UI consumes this list (page renders flat, entry pickers want
  // every option), so fetch a large slab and avoid the >30 silent-cutoff trap.
  return useResourceList<PaymentMethodResponse>(BASE, KEY, { limit: 200 });
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
