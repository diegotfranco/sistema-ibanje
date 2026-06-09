import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormSetValue,
  useWatch
} from 'react-hook-form';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import DateInput from '@/components/DateInput';
import EntityPicker from '@/components/EntityPicker';
import MoneyInput from '../components/MoneyInput';
import { LinkPicker } from '../components/LinkPicker';
import { ActiveStatus, EntryStatus, CampaignStatus } from '@sistema-ibanje/shared';
import { useIncomeCategories } from '@/modules/finance/income-categories/useIncomeCategories';
import { usePaymentMethods } from '@/modules/finance/payment-methods/usePaymentMethods';
import { useCampaigns } from '@/modules/finance/campaigns/useCampaigns';
import { useEvents } from '@/modules/finance/events/useEvents';
import { useAttenders } from '@/modules/attenders/useAttenders';
import type { IncomeEntryFormValues } from './schema';

interface Props {
  control: Control<IncomeEntryFormValues>;
  errors: FieldErrors<IncomeEntryFormValues>;
  setValue: UseFormSetValue<IncomeEntryFormValues>;
}

export function IncomeEntryFields({ control, errors, setValue }: Props) {
  const incomeCategories = useIncomeCategories();
  const paymentMethods = usePaymentMethods();
  const campaigns = useCampaigns({ limit: 200, status: CampaignStatus.Active });
  const eventsList = useEvents({ limit: 200, status: 'ativo' });
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
  const activeCampaigns = (campaigns.data?.data ?? []).filter(
    (f) => f.status === CampaignStatus.Active
  );
  const activeEvents = eventsList.data?.data ?? [];
  const activeAttenders = (attenders.data?.data ?? []).filter(
    (a) => a.status === ActiveStatus.Active
  );

  const watchedCategoryId = useWatch({ control, name: 'categoryId' });
  const selectedCategory = leafCategories.find((c) => c.id === watchedCategoryId);
  const requiresMember = selectedCategory?.requiresMember ?? false;

  const watchedCampaignId = useWatch({ control, name: 'campaignId' });
  const watchedEventId = useWatch({ control, name: 'eventId' });

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Controller
          name="status"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Status</FieldLabel>
              <Select
                value={field.value ?? EntryStatus.Paid}
                onValueChange={(v) => field.onChange(v as IncomeEntryFormValues['status'])}>
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
                ariaLabel="Congregado"
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
            campaigns={activeCampaigns}
            events={activeEvents}
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
