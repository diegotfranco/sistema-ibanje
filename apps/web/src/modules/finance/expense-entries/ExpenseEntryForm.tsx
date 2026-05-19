import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { EntryStatus } from '@sistema-ibanje/shared';
import { zodResolver } from '@/lib/zodResolver';
import { ExpenseEntryFields } from './ExpenseEntryFields';
import { ReceiptField } from './ReceiptField';
import {
  ExpenseEntryFormSchema,
  type ExpenseEntryFormValues,
  type ExpenseEntryResponse
} from './schema';

interface Props {
  initialValues?: ExpenseEntryResponse;
  isPending: boolean;
  onSubmit: (values: ExpenseEntryFormValues) => void;
  onCancel: () => void;
}

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
      attenderId: initialValues?.attenderId ?? undefined,
      notes: initialValues?.notes ?? '',
      status: (initialValues?.status as ExpenseEntryFormValues['status']) ?? undefined
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <ExpenseEntryFields control={control} errors={errors} />

      {initialValues !== undefined && (
        <>
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

          <Field>
            <FieldLabel>Comprovante</FieldLabel>
            <ReceiptField entryId={initialValues.id} hasReceipt={initialValues.hasReceipt} />
          </Field>
        </>
      )}

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
