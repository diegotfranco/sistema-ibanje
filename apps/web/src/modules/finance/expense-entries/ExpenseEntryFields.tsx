import {
  Controller,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormSetValue
} from 'react-hook-form';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import DateInput from '@/components/DateInput';
import EntityPicker from '@/components/EntityPicker';
import MoneyInput from '../components/MoneyInput';
import { LinkPicker } from '../components/LinkPicker';
import { ActiveStatus, EntryStatus, CampaignStatus } from '@sistema-ibanje/shared';
import { useExpenseCategories } from '@/modules/finance/expense-categories/useExpenseCategories';
import { usePaymentMethods } from '@/modules/finance/payment-methods/usePaymentMethods';
import { useCampaigns } from '@/modules/finance/campaigns/useCampaigns';
import { useEvents } from '@/modules/finance/events/useEvents';
import { useAttenders } from '@/modules/attenders/useAttenders';
import type { ExpenseEntryFormValues } from './schema';

interface Props {
  control: Control<ExpenseEntryFormValues>;
  errors: FieldErrors<ExpenseEntryFormValues>;
  setValue: UseFormSetValue<ExpenseEntryFormValues>;
  detailsDefaultOpen?: boolean;
}

export function ExpenseEntryFields({ control, errors, setValue }: Props) {
  const isInstallment = useWatch({ control, name: 'isInstallment' });
  const expenseCategories = useExpenseCategories();
  const paymentMethods = usePaymentMethods();
  const campaigns = useCampaigns({ limit: 200, status: CampaignStatus.Active });
  const eventsList = useEvents({ limit: 200, status: 'ativo' });
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
  const campaignsList = (campaigns.data?.data ?? []).filter(
    (f) => f.status === CampaignStatus.Active
  );
  const eventsListData = eventsList.data?.data ?? [];
  const attendersList = (attenders.data?.data ?? []).filter(
    (a) => a.status === ActiveStatus.Active
  );

  const watchedCampaignId = useWatch({ control, name: 'campaignId' });
  const watchedEventId = useWatch({ control, name: 'eventId' });

  return (
    <div className="space-y-4">
      <Controller
        name="date"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor="date">Data</FieldLabel>
            <DateInput id="date" value={field.value} onChange={field.onChange} />
            {errors.date && <FieldError>{errors.date.message}</FieldError>}
          </Field>
        )}
      />

      <Controller
        name="isInstallment"
        control={control}
        render={({ field }) => (
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <Checkbox
              id="isInstallment"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(Boolean(checked))}
            />
            Esta despesa é parcelada?
          </label>
        )}
      />

      {isInstallment ? (
        <>
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
                  <MoneyInput id="total" value={field.value ?? ''} onChange={field.onChange} />
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
                    value={field.value ?? ''}
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
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                  {errors.totalInstallments && (
                    <FieldError>{errors.totalInstallments.message}</FieldError>
                  )}
                </Field>
              )}
            />
          </div>
        </>
      ) : (
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="amount">Valor (R$)</FieldLabel>
              <MoneyInput id="amount" value={field.value} onChange={field.onChange} />
              {errors.amount && <FieldError>{errors.amount.message}</FieldError>}
            </Field>
          )}
        />
      )}

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
                ariaLabel="Categoria"
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Controller
          name="status"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Status</FieldLabel>
              <Select
                value={field.value ?? EntryStatus.Paid}
                onValueChange={(v) => field.onChange(v as ExpenseEntryFormValues['status'])}>
                <SelectTrigger className="w-full" aria-label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EntryStatus.Pending}>Pendente</SelectItem>
                  <SelectItem value={EntryStatus.Paid}>Paga</SelectItem>
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError>{fieldState.error?.message}</FieldError>}
            </Field>
          )}
        />

        <Controller
          name="attenderId"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="attenderId">Congregado Patrocinador</FieldLabel>
              <EntityPicker
                items={attendersList}
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? undefined)}
                getValue={(a) => a.id}
                getLabel={(a) => a.name}
                placeholder="Selecionar congregado..."
                emptyMessage="Nenhum congregado encontrado."
                isLoading={attenders.isLoading}
                ariaLabel="Congregado patrocinador"
                allowClear
                className="w-full"
              />
              {errors.attenderId && <FieldError>{errors.attenderId.message}</FieldError>}
            </Field>
          )}
        />

        <Field>
          <FieldLabel>Vincular a (opcional)</FieldLabel>
          <LinkPicker
            campaigns={campaignsList}
            events={eventsListData}
            campaignId={watchedCampaignId}
            eventId={watchedEventId}
            onChangeCampaign={(id) => setValue('campaignId', id, { shouldDirty: true })}
            onChangeEvent={(id) => setValue('eventId', id, { shouldDirty: true })}
            isLoading={campaigns.isLoading || eventsList.isLoading}
            ariaLabel="Vincular a campanha ou evento"
            className="w-full"
          />
          {errors.campaignId && <FieldError>{errors.campaignId.message}</FieldError>}
          {errors.eventId && <FieldError>{errors.eventId.message}</FieldError>}
        </Field>
      </div>

      <Controller
        name="notes"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor="notes">Observações</FieldLabel>
            <Textarea id="notes" placeholder="Adicione observações se necessário" {...field} />
            {errors.notes && <FieldError>{errors.notes.message}</FieldError>}
          </Field>
        )}
      />
    </div>
  );
}
