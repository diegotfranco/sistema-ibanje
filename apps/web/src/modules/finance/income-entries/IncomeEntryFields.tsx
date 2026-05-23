import { Controller, type Control, type FieldErrors, useWatch } from 'react-hook-form';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import DateInput from '@/components/DateInput';
import EntityPicker from '@/components/EntityPicker';
import MoneyInput from '../components/MoneyInput';
import { ActiveStatus } from '@sistema-ibanje/shared';
import { useIncomeCategories } from '@/modules/finance/income-categories/useIncomeCategories';
import { usePaymentMethods } from '@/modules/finance/payment-methods/usePaymentMethods';
import { useDesignatedFunds } from '@/modules/finance/designated-funds/useDesignatedFunds';
import { useAttenders } from '@/modules/attenders/useAttenders';
import type { IncomeEntryFormValues } from './schema';

const NONE = '__none__';

interface Props {
  control: Control<IncomeEntryFormValues>;
  errors: FieldErrors<IncomeEntryFormValues>;
}

export function IncomeEntryFields({ control, errors }: Props) {
  const incomeCategories = useIncomeCategories();
  const paymentMethods = usePaymentMethods();
  const designatedFunds = useDesignatedFunds();
  const attenders = useAttenders();

  const allCats = incomeCategories.data?.data ?? [];
  const parentIds = new Set(allCats.filter((c) => c.parentId !== null).map((c) => c.parentId!));
  const leafCategories = allCats.filter(
    (c) => c.status === ActiveStatus.Active && !parentIds.has(c.id)
  );

  const getCategoryLabel = (cat: { id: number; name: string; parentId: number | null }) => {
    const parent = allCats.find((c) => c.id === cat.parentId);
    return parent ? `${parent.name} / ${cat.name}` : cat.name;
  };

  const inflowMethods = (paymentMethods.data?.data ?? []).filter(
    (m) => m.status === ActiveStatus.Active && m.allowsInflow
  );
  const activeFunds = (designatedFunds.data?.data ?? []).filter(
    (f) => f.status === ActiveStatus.Active
  );
  const activeAttenders = (attenders.data?.data ?? []).filter(
    (a) => a.status === ActiveStatus.Active
  );

  const watchedCategoryId = useWatch({ control, name: 'categoryId' });
  const selectedCategory = leafCategories.find((c) => c.id === watchedCategoryId);
  const requiresMember = selectedCategory?.requiresMember ?? false;

  return (
    <div className="space-y-4">
      <Controller
        name="depositDate"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor="depositDate">Data de Depósito</FieldLabel>
            <DateInput id="depositDate" value={field.value} onChange={field.onChange} />
            {errors.depositDate && <FieldError>{errors.depositDate.message}</FieldError>}
          </Field>
        )}
      />

      <Controller
        name="amount"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor="amount">Valor (R$)</FieldLabel>
            <MoneyInput
              id="amount"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder="0.00"
            />
            {errors.amount && <FieldError>{errors.amount.message}</FieldError>}
          </Field>
        )}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Controller
          name="categoryId"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="categoryId">Categoria</FieldLabel>
              <EntityPicker
                items={leafCategories}
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? undefined)}
                getValue={(c) => c.id}
                getLabel={getCategoryLabel}
                placeholder="Selecionar categoria..."
                emptyMessage="Nenhuma categoria encontrada."
                isLoading={incomeCategories.isLoading}
                className="w-full"
              />
              {errors.categoryId && <FieldError>{errors.categoryId.message}</FieldError>}
            </Field>
          )}
        />

        <Controller
          name="paymentMethodId"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="paymentMethodId">Forma de Pagamento</FieldLabel>
              <Select
                value={field.value !== undefined ? String(field.value) : ''}
                onValueChange={(v) => field.onChange(Number(v))}>
                <SelectTrigger id="paymentMethodId" className="w-full">
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  {inflowMethods.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.paymentMethodId && <FieldError>{errors.paymentMethodId.message}</FieldError>}
            </Field>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Controller
          name="designatedFundId"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="designatedFundId">Fundo Designado</FieldLabel>
              <Select
                value={field.value !== undefined ? String(field.value) : NONE}
                onValueChange={(v) => field.onChange(v === NONE ? undefined : Number(v))}>
                <SelectTrigger id="designatedFundId" className="w-full">
                  <SelectValue placeholder="Sem fundo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sem fundo</SelectItem>
                  {activeFunds.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.designatedFundId && (
                <FieldError>{errors.designatedFundId.message}</FieldError>
              )}
            </Field>
          )}
        />

        <Controller
          name="attenderId"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="attenderId">
                Congregado{requiresMember ? ' *' : ' (opcional)'}
              </FieldLabel>
              <EntityPicker
                items={activeAttenders}
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? undefined)}
                getValue={(a) => a.id}
                getLabel={(a) => a.name}
                placeholder="Selecionar congregado..."
                emptyMessage="Nenhum congregado encontrado."
                isLoading={attenders.isLoading}
                allowClear
                className="w-full"
              />
              {errors.attenderId && <FieldError>{errors.attenderId.message}</FieldError>}
            </Field>
          )}
        />
      </div>

      <Controller
        name="notes"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor="notes">Observações</FieldLabel>
            <Textarea
              id="notes"
              placeholder="Adicione observações se necessário"
              rows={2}
              {...field}
            />
            {errors.notes && <FieldError>{errors.notes.message}</FieldError>}
          </Field>
        )}
      />
    </div>
  );
}
