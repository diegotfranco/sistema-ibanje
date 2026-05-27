import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Field, FieldLabel } from '@/components/ui/field';
import { zodResolver } from '@/lib/zodResolver';
import { EntryStatus } from '@sistema-ibanje/shared';
import { ExpenseEntryFields } from './ExpenseEntryFields';
import { ReceiptField } from './ReceiptField';
import { ExpenseEntryFormSchema, type ExpenseEntryFormValues } from './schema';
import { useExpenseEntryMutations, useUploadReceipt } from './useExpenseEntries';

interface Props {
  onCreated?: () => void;
}

export function ExpenseQuickEntryForm({ onCreated }: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
    setFocus,
    setValue
  } = useForm<ExpenseEntryFormValues>({
    resolver: zodResolver(ExpenseEntryFormSchema),
    defaultValues: {
      isInstallment: false,
      date: new Date().toISOString().slice(0, 10),
      amount: '',
      total: '',
      installment: 1,
      totalInstallments: 1,
      categoryId: undefined,
      paymentMethodId: undefined,
      designatedFundId: undefined,
      eventId: undefined,
      attenderId: undefined,
      notes: '',
      status: EntryStatus.Paid
    }
  });

  const { create } = useExpenseEntryMutations();
  const uploadReceipt = useUploadReceipt();
  const [stagedFile, setStagedFile] = useState<File | null>(null);

  const onSubmit = (values: ExpenseEntryFormValues) => {
    const amountNum = Number.parseFloat(values.amount);
    const body = {
      date: values.date,
      amount: amountNum,
      total: values.isInstallment ? Number.parseFloat(values.total!) : amountNum,
      installment: values.isInstallment ? values.installment! : 1,
      totalInstallments: values.isInstallment ? values.totalInstallments! : 1,
      categoryId: values.categoryId!,
      paymentMethodId: values.paymentMethodId!,
      status: values.status,
      ...(values.designatedFundId !== undefined
        ? { designatedFundId: values.designatedFundId }
        : {}),
      ...(values.eventId !== undefined ? { eventId: values.eventId } : {}),
      ...(values.attenderId !== undefined ? { attenderId: values.attenderId } : {}),
      ...(values.notes ? { notes: values.notes } : {})
    };

    create.mutate(body, {
      onSuccess: async (created) => {
        if (stagedFile) {
          try {
            await uploadReceipt.mutateAsync({ id: created.id, file: stagedFile });
          } catch {
            // upload error already toasted; keep form visible for retry via edit
          }
          setStagedFile(null);
        }
        const currentDate = getValues('date');
        reset({
          isInstallment: false,
          date: currentDate,
          amount: '',
          total: '',
          installment: 1,
          totalInstallments: 1,
          categoryId: undefined,
          paymentMethodId: undefined,
          designatedFundId: undefined,
          attenderId: undefined,
          notes: '',
          status: EntryStatus.Paid
        });
        setFocus('amount');
        onCreated?.();
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="py-0.75">Novo lançamento</CardTitle>
      </CardHeader>
      <CardContent className="mt-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <ExpenseEntryFields control={control} errors={errors} setValue={setValue} />

          <Field>
            <FieldLabel>Comprovante</FieldLabel>
            <ReceiptField
              hasReceipt={false}
              stagedFile={stagedFile}
              stagedRemoval={false}
              onStage={setStagedFile}
              onStageRemoval={() => {}}
            />
          </Field>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={create.isPending || uploadReceipt.isPending}
              className="w-full sm:w-auto sm:min-w-32">
              {create.isPending || uploadReceipt.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
