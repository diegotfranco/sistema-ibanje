import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/Button';
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

export interface StagedReceipt {
  stagedFile: File | null;
  stagedRemoval: boolean;
}

interface Props {
  initialValues?: ExpenseEntryResponse;
  isPending: boolean;
  onSubmit: (values: ExpenseEntryFormValues, receipt: StagedReceipt) => void;
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

  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [stagedRemoval, setStagedRemoval] = useState(false);

  const detailsDefaultOpen = Boolean(
    initialValues?.designatedFundId || initialValues?.attenderId || initialValues?.notes
  );

  const handleStage = (file: File | null) => {
    setStagedFile(file);
    if (file) setStagedRemoval(false);
  };

  const handleStageRemoval = (remove: boolean) => {
    setStagedRemoval(remove);
    if (remove) setStagedFile(null);
  };

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(values, { stagedFile, stagedRemoval }))}
      className="space-y-6">
      <ExpenseEntryFields
        control={control}
        errors={errors}
        detailsDefaultOpen={detailsDefaultOpen}
      />

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
            <ReceiptField
              entryId={initialValues.id}
              hasReceipt={initialValues.hasReceipt}
              stagedFile={stagedFile}
              stagedRemoval={stagedRemoval}
              onStage={handleStage}
              onStageRemoval={handleStageRemoval}
            />
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
