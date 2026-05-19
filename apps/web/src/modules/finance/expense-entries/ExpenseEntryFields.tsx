import { ChevronDown } from 'lucide-react';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
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
import { useExpenseCategories } from '@/modules/finance/expense-categories/useExpenseCategories';
import { usePaymentMethods } from '@/modules/finance/payment-methods/usePaymentMethods';
import { useDesignatedFunds } from '@/modules/finance/designated-funds/useDesignatedFunds';
import { useAttenders } from '@/modules/attenders/useAttenders';
import type { ExpenseEntryFormValues } from './schema';

const NONE = '__none__';

interface Props {
  control: Control<ExpenseEntryFormValues>;
  errors: FieldErrors<ExpenseEntryFormValues>;
}

export function ExpenseEntryFields({ control, errors }: Props) {
  const expenseCategories = useExpenseCategories();
  const paymentMethods = usePaymentMethods();
  const designatedFunds = useDesignatedFunds();
  const attenders = useAttenders();

  const allCats = expenseCategories.data?.data ?? [];
  const parentIds = new Set(allCats.filter((c) => c.parentId !== null).map((c) => c.parentId!));
  const leafCategories = allCats.filter(
    (c) => c.status === ActiveStatus.Active && !parentIds.has(c.id)
  );

  const getCategoryLabel = (cat: { id: number; name: string; parentId: number | null }) => {
    const parent = allCats.find((c) => c.id === cat.parentId);
    return parent ? `${parent.name} / ${cat.name}` : cat.name;
  };

  const paymentMethodsList = (paymentMethods.data?.data ?? []).filter((m) => m.allowsOutflow);
  const designatedFundsList = designatedFunds.data?.data ?? [];
  const attendersList = (attenders.data?.data ?? []).filter(
    (a) => a.status === ActiveStatus.Active
  );

  return (
    <div className="space-y-4">
      <Controller
        name="referenceDate"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor="referenceDate">Data</FieldLabel>
            <DateInput id="referenceDate" value={field.value} onChange={field.onChange} />
            {errors.referenceDate && <FieldError>{errors.referenceDate.message}</FieldError>}
          </Field>
        )}
      />

      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor="description">Descrição</FieldLabel>
            <Input id="description" placeholder="Descrição da despesa" maxLength={256} {...field} />
            {errors.description && <FieldError>{errors.description.message}</FieldError>}
          </Field>
        )}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="amount">Valor da Parcela (R$)</FieldLabel>
              <MoneyInput id="amount" value={field.value} onChange={field.onChange} />
              {errors.amount && <FieldError>{errors.amount.message}</FieldError>}
            </Field>
          )}
        />
        <Controller
          name="total"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="total">Valor Total (R$)</FieldLabel>
              <MoneyInput id="total" value={field.value} onChange={field.onChange} />
              {errors.total && <FieldError>{errors.total.message}</FieldError>}
            </Field>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Controller
          name="installment"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="installment">Parcela Nº</FieldLabel>
              <Input
                id="installment"
                type="number"
                min="1"
                value={field.value}
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
              />
              {errors.installment && <FieldError>{errors.installment.message}</FieldError>}
            </Field>
          )}
        />
        <Controller
          name="totalInstallments"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="totalInstallments">Total de Parcelas</FieldLabel>
              <Input
                id="totalInstallments"
                type="number"
                min="1"
                value={field.value}
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
              />
              {errors.totalInstallments && (
                <FieldError>{errors.totalInstallments.message}</FieldError>
              )}
            </Field>
          )}
        />
      </div>

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
                isLoading={expenseCategories.isLoading}
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
                  <SelectValue placeholder="Selecione uma forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethodsList.map((method) => (
                    <SelectItem key={method.id} value={String(method.id)}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.paymentMethodId && <FieldError>{errors.paymentMethodId.message}</FieldError>}
            </Field>
          )}
        />
      </div>

      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 text-muted-foreground data-[state=open]:[&_svg]:rotate-180">
            <ChevronDown size={16} className="mr-1 transition-transform" />
            Detalhes opcionais
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 data-[state=open]:animate-in data-[state=closed]:animate-out">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                name="designatedFundId"
                control={control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="designatedFundId">Fundo Designado (opcional)</FieldLabel>
                    <Select
                      value={field.value !== undefined ? String(field.value) : NONE}
                      onValueChange={(v) => field.onChange(v === NONE ? undefined : Number(v))}>
                      <SelectTrigger id="designatedFundId" className="w-full">
                        <SelectValue placeholder="Selecione um fundo (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Sem fundo</SelectItem>
                        {designatedFundsList.map((fund) => (
                          <SelectItem key={fund.id} value={String(fund.id)}>
                            {fund.name}
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
                    <FieldLabel htmlFor="attenderId">Congregado Patrocinador (opcional)</FieldLabel>
                    <EntityPicker
                      items={attendersList}
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
                  <FieldLabel htmlFor="notes">Observações (opcional)</FieldLabel>
                  <Textarea
                    id="notes"
                    placeholder="Adicione observações se necessário"
                    {...field}
                  />
                  {errors.notes && <FieldError>{errors.notes.message}</FieldError>}
                </Field>
              )}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
