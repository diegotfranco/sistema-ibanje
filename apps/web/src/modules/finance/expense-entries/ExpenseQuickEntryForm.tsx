import { useForm } from 'react-hook-form';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { zodResolver } from '@/lib/zodResolver';
import { ExpenseEntryFields } from './ExpenseEntryFields';
import { ExpenseEntryFormSchema, type ExpenseEntryFormValues } from './schema';
import { useExpenseEntryMutations } from './useExpenseEntries';

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
    setFocus
  } = useForm<ExpenseEntryFormValues>({
    resolver: zodResolver(ExpenseEntryFormSchema),
    defaultValues: {
      referenceDate: new Date().toISOString().slice(0, 10),
      description: '',
      amount: '',
      total: '',
      installment: 1,
      totalInstallments: 1,
      categoryId: undefined,
      paymentMethodId: undefined,
      designatedFundId: undefined,
      attenderId: undefined,
      notes: ''
    }
  });

  const { create } = useExpenseEntryMutations();

  const onSubmit = (values: ExpenseEntryFormValues) => {
    const body = {
      referenceDate: values.referenceDate,
      description: values.description,
      amount: Number.parseFloat(values.amount),
      total: Number.parseFloat(values.total),
      installment: values.installment,
      totalInstallments: values.totalInstallments,
      categoryId: values.categoryId!,
      paymentMethodId: values.paymentMethodId!,
      ...(values.designatedFundId !== undefined
        ? { designatedFundId: values.designatedFundId }
        : {}),
      ...(values.attenderId !== undefined ? { attenderId: values.attenderId } : {}),
      ...(values.notes ? { notes: values.notes } : {})
    };

    create.mutate(body, {
      onSuccess: () => {
        const currentDate = getValues('referenceDate');
        reset({
          referenceDate: currentDate,
          description: '',
          amount: '',
          total: '',
          installment: 1,
          totalInstallments: 1,
          categoryId: undefined,
          paymentMethodId: undefined,
          designatedFundId: undefined,
          attenderId: undefined,
          notes: ''
        });
        setFocus('description');
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
          <ExpenseEntryFields control={control} errors={errors} />

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={create.isPending}
              className="w-full sm:w-auto sm:min-w-32">
              {create.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
