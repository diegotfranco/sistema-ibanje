import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/Button';
import { DialogFooter } from '@/components/Dialog';
import { zodResolver } from '@/lib/zodResolver';
import { ActiveStatus, EntryStatus } from '@sistema-ibanje/shared';
import { useIncomeCategories } from '@/modules/finance/income-categories/useIncomeCategories';
import { IncomeEntryFields } from './IncomeEntryFields';
import {
  IncomeEntryFormSchema,
  type IncomeEntryFormValues,
  type IncomeEntryResponse
} from './schema';

interface Props {
  initialValues?: IncomeEntryResponse;
  isPending: boolean;
  onSubmit: (values: IncomeEntryFormValues) => void;
  onCancel: () => void;
}

export function IncomeEntryForm({ initialValues, isPending, onSubmit, onCancel }: Props) {
  const incomeCategories = useIncomeCategories();
  const allCats = incomeCategories.data?.data ?? [];
  const parentIds = new Set(allCats.filter((c) => c.parentId !== null).map((c) => c.parentId!));
  const leafCategories = allCats.filter(
    (c) => c.status === ActiveStatus.Active && !parentIds.has(c.id)
  );

  const form = useForm<IncomeEntryFormValues>({
    resolver: zodResolver(IncomeEntryFormSchema),
    defaultValues: {
      depositDate: initialValues?.depositDate ?? '',
      amount: initialValues?.amount ?? '',
      categoryId: initialValues?.categoryId ?? undefined,
      attenderId: initialValues?.attenderId ?? undefined,
      paymentMethodId: initialValues?.paymentMethodId ?? undefined,
      campaignId: initialValues?.campaignId ?? undefined,
      eventId: initialValues?.eventId ?? undefined,
      notes: initialValues?.notes ?? '',
      status: (initialValues?.status as IncomeEntryFormValues['status']) ?? EntryStatus.Paid
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

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" noValidate>
      <IncomeEntryFields
        control={form.control}
        errors={form.formState.errors}
        setValue={form.setValue}
      />

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
