import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
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
import MoneyInput from '@/components/MoneyInput';
import EntityPicker from '@/components/EntityPicker';
import { ActiveStatus, EntryStatus } from '@/lib/status';
import { zodResolver } from '@/lib/zodResolver';
import { useExpenseCategories } from '@/modules/finance/expense-categories/useExpenseCategories';
import { usePaymentMethods } from '@/modules/finance/payment-methods/usePaymentMethods';
import { useDesignatedFunds } from '@/modules/finance/designated-funds/useDesignatedFunds';
import { useMembers } from '@/modules/members/useMembers';
import { ReceiptField } from './ReceiptField';
import {
  ExpenseEntryFormSchema,
  type ExpenseEntryFormValues,
  type ExpenseEntryResponse
} from '@/schemas/expense-entry';

interface Props {
  initialValues?: ExpenseEntryResponse;
  isPending: boolean;
  onSubmit: (values: ExpenseEntryFormValues) => void;
  onCancel: () => void;
}

const NONE = '__none__';

export function ExpenseEntryForm({ initialValues, isPending, onSubmit, onCancel }: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<ExpenseEntryFormValues>({
    resolver: zodResolver(ExpenseEntryFormSchema),
    defaultValues: {
      referenceDate: initialValues?.referenceDate ?? '',
      description: initialValues?.description ?? '',
      amount: initialValues?.amount ?? '',
      total: initialValues?.total ?? '',
      installment: initialValues?.installment ?? 1,
      totalInstallments: initialValues?.totalInstallments ?? 1,
      categoryId: initialValues?.categoryId ?? undefined,
      paymentMethodId: initialValues?.paymentMethodId ?? undefined,
      designatedFundId: initialValues?.designatedFundId ?? undefined,
      memberId: initialValues?.memberId ?? undefined,
      notes: initialValues?.notes ?? '',
      status: (initialValues?.status as ExpenseEntryFormValues['status']) ?? undefined
    }
  });

  const expenseCategories = useExpenseCategories();
  const paymentMethods = usePaymentMethods();
  const designatedFunds = useDesignatedFunds();
  const members = useMembers();

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

  const membersList = (members.data?.data ?? []).filter((m) => m.status === ActiveStatus.Active);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FieldGroup>
        <div className="grid grid-cols-1 gap-4">
          {/* referenceDate */}
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

          {/* description */}
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="description">Descrição</FieldLabel>
                <Input
                  id="description"
                  placeholder="Descrição da despesa"
                  maxLength={256}
                  {...field}
                />
                {errors.description && <FieldError>{errors.description.message}</FieldError>}
              </Field>
            )}
          />

          {/* amount + total */}
          <div className="grid grid-cols-2 gap-4">
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

          {/* installment + totalInstallments */}
          <div className="grid grid-cols-2 gap-4">
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

          {/* categoryId */}
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

          {/* paymentMethodId */}
          <Controller
            name="paymentMethodId"
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="paymentMethodId">Forma de Pagamento</FieldLabel>
                <Select
                  value={field.value !== undefined ? String(field.value) : ''}
                  onValueChange={(v) => field.onChange(Number(v))}>
                  <SelectTrigger id="paymentMethodId">
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
                {errors.paymentMethodId && (
                  <FieldError>{errors.paymentMethodId.message}</FieldError>
                )}
              </Field>
            )}
          />

          {/* designatedFundId */}
          <Controller
            name="designatedFundId"
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="designatedFundId">Fundo Designado (opcional)</FieldLabel>
                <Select
                  value={field.value !== undefined ? String(field.value) : NONE}
                  onValueChange={(v) => field.onChange(v === NONE ? undefined : Number(v))}>
                  <SelectTrigger id="designatedFundId">
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

          {/* memberId */}
          <Controller
            name="memberId"
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="memberId">Membro Patrocinador (opcional)</FieldLabel>
                <EntityPicker
                  items={membersList}
                  value={field.value ?? null}
                  onChange={(v) => field.onChange(v ?? undefined)}
                  getValue={(m) => m.id}
                  getLabel={(m) => m.name}
                  placeholder="Selecionar membro..."
                  emptyMessage="Nenhum membro encontrado."
                  isLoading={members.isLoading}
                  allowClear
                  className="w-full"
                />
                {errors.memberId && <FieldError>{errors.memberId.message}</FieldError>}
              </Field>
            )}
          />

          {/* notes */}
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="notes">Observações (opcional)</FieldLabel>
                <Textarea id="notes" placeholder="Adicione observações se necessário" {...field} />
                {errors.notes && <FieldError>{errors.notes.message}</FieldError>}
              </Field>
            )}
          />

          {/* status (only when editing) */}
          {initialValues !== undefined && (
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="status">Status</FieldLabel>
                  <Select
                    value={field.value !== undefined ? String(field.value) : ''}
                    onValueChange={(v) => field.onChange(v)}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={EntryStatus.Pending}>Pendente</SelectItem>
                      <SelectItem value={EntryStatus.Paid}>Paga</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && <FieldError>{errors.status.message}</FieldError>}
                </Field>
              )}
            />
          )}

          {/* Receipt field (only when editing) */}
          {initialValues !== undefined && (
            <Field>
              <FieldLabel>Comprovante</FieldLabel>
              <ReceiptField entryId={initialValues.id} receipt={initialValues.receipt ?? null} />
            </Field>
          )}
        </div>
      </FieldGroup>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </DialogFooter>
    </form>
  );
}
