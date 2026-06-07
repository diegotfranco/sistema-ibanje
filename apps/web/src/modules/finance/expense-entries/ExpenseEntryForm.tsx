import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/Button';
import { DialogFooter } from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
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
    formState: { errors },
    setValue
  } = useForm<ExpenseEntryFormValues>({
    resolver: zodResolver(ExpenseEntryFormSchema),
    defaultValues: {
      isInstallment: initialValues ? initialValues.totalInstallments > 1 : false,
      date: initialValues?.date ?? '',
      amount: initialValues?.amount ?? '',
      total: initialValues?.total ?? '',
      installment: initialValues?.installment ?? 1,
      totalInstallments: initialValues?.totalInstallments ?? 1,
      categoryId: initialValues?.categoryId ?? undefined,
      paymentMethodId: initialValues?.paymentMethodId ?? undefined,
      designatedFundId: initialValues?.designatedFundId ?? undefined,
      eventId: initialValues?.eventId ?? undefined,
      attenderId: initialValues?.attenderId ?? undefined,
      notes: initialValues?.notes ?? '',
      status: (initialValues?.status as ExpenseEntryFormValues['status']) ?? EntryStatus.Paid
    }
  });

  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [stagedRemoval, setStagedRemoval] = useState(false);

  const detailsDefaultOpen = Boolean(
    initialValues?.designatedFundId ||
    initialValues?.eventId ||
    initialValues?.attenderId ||
    initialValues?.notes
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
        setValue={setValue}
        detailsDefaultOpen={detailsDefaultOpen}
      />

      {initialValues !== undefined && (
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
