import { Controller, useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import DateInput from '@/components/DateInput';
import MoneyInput from '@/components/MoneyInput';
import EntityPicker from '@/components/EntityPicker';
import { zodResolver } from '@/lib/zodResolver';
import { ActiveStatus, EntryStatus } from '@sistema-ibanje/shared';
import { useIncomeCategories } from '@/modules/finance/income-categories/useIncomeCategories';
import { usePaymentMethods } from '@/modules/finance/payment-methods/usePaymentMethods';
import { useDesignatedFunds } from '@/modules/finance/designated-funds/useDesignatedFunds';
import { useAttenders } from '@/modules/attenders/useAttenders';
import {
  IncomeEntryFormSchema,
  type IncomeEntryFormValues,
  type IncomeEntryResponse
} from '@/schemas/income-entry';

interface Props {
  initialValues?: IncomeEntryResponse;
  isPending: boolean;
  onSubmit: (values: IncomeEntryFormValues) => void;
  onCancel: () => void;
}

const NONE = '__none__';

export function IncomeEntryForm({ initialValues, isPending, onSubmit, onCancel }: Props) {
  const incomeCategories = useIncomeCategories();
  const paymentMethods = usePaymentMethods();
  const designatedFunds = useDesignatedFunds();
  const attenders = useAttenders();

  const allCats = incomeCategories.data?.data ?? [];
  const parentIds = new Set(allCats.filter((c) => c.parentId !== null).map((c) => c.parentId!));
  const leafCategories = allCats.filter(
    (c) => c.status === ActiveStatus.Active && !parentIds.has(c.id)
  );

  const inflowMethods = (paymentMethods.data?.data ?? []).filter(
    (m) => m.status === ActiveStatus.Active && m.allowsInflow
  );
  const activeFunds = (designatedFunds.data?.data ?? []).filter(
    (f) => f.status === ActiveStatus.Active
  );
  const activeAttenders = (attenders.data?.data ?? []).filter(
    (a) => a.status === ActiveStatus.Active
  );

  const getCategoryLabel = (cat: { id: number; name: string; parentId: number | null }) => {
    const parent = allCats.find((c) => c.id === cat.parentId);
    return parent ? `${parent.name} / ${cat.name}` : cat.name;
  };

  const form = useForm<IncomeEntryFormValues>({
    resolver: zodResolver(IncomeEntryFormSchema),
    defaultValues: {
      referenceDate: initialValues?.referenceDate ?? '',
      depositDate: initialValues?.depositDate ?? '',
      amount: initialValues?.amount ?? '',
      categoryId: initialValues?.categoryId ?? undefined,
      attenderId: initialValues?.attenderId ?? undefined,
      paymentMethodId: initialValues?.paymentMethodId ?? undefined,
      designatedFundId: initialValues?.designatedFundId ?? undefined,
      notes: initialValues?.notes ?? '',
      status: (initialValues?.status as IncomeEntryFormValues['status']) ?? undefined
    }
  });

  const watchedCategoryId = useWatch({ control: form.control, name: 'categoryId' });
  const selectedCategory = leafCategories.find((c) => c.id === watchedCategoryId);
  const requiresMember = selectedCategory?.requiresMember ?? false;

  const handleSubmit = (values: IncomeEntryFormValues) => {
    if (requiresMember && !values.attenderId) {
      form.setError('attenderId', { message: 'Congregado é obrigatório para esta categoria.' });
      return;
    }
    onSubmit(values);
  };

  const isEditing = initialValues !== undefined;

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" noValidate>
      <FieldGroup>
        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="referenceDate"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Data de Referência</FieldLabel>
                <DateInput {...field} aria-invalid={fieldState.invalid} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="depositDate"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Data de Depósito</FieldLabel>
                <DateInput {...field} aria-invalid={fieldState.invalid} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        <Controller
          name="amount"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Valor (R$)</FieldLabel>
              <MoneyInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                aria-invalid={fieldState.invalid}
                placeholder="0.00"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="categoryId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Categoria</FieldLabel>
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="paymentMethodId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Forma de Pagamento</FieldLabel>
              <Select
                value={field.value !== undefined ? String(field.value) : ''}
                onValueChange={(v) => field.onChange(Number(v))}>
                <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="attenderId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Congregado{requiresMember ? ' *' : ' (opcional)'}</FieldLabel>
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="designatedFundId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Fundo Designado (opcional)</FieldLabel>
              <Select
                value={field.value !== undefined ? String(field.value) : NONE}
                onValueChange={(v) => field.onChange(v === NONE ? undefined : Number.parseInt(v))}>
                <SelectTrigger className="w-full">
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {isEditing && (
          <Controller
            name="status"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Status</FieldLabel>
                <Select
                  value={field.value ?? EntryStatus.Pending}
                  onValueChange={(v) => field.onChange(v as IncomeEntryFormValues['status'])}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EntryStatus.Pending}>Pendente</SelectItem>
                    <SelectItem value={EntryStatus.Paid}>Paga</SelectItem>
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        )}

        <Controller
          name="notes"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Observações (opcional)</FieldLabel>
              <Textarea {...field} aria-invalid={fieldState.invalid} rows={2} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </DialogFooter>
    </form>
  );
}
