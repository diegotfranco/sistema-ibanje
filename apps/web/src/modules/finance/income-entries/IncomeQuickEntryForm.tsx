import { useForm } from 'react-hook-form';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { zodResolver } from '@/lib/zodResolver';
import { useIncomeCategories } from '@/modules/finance/income-categories/useIncomeCategories';
import { IncomeEntryFields } from './IncomeEntryFields';
import { IncomeEntryFormSchema, type IncomeEntryFormValues } from './schema';
import { useIncomeEntryMutations } from './useIncomeEntries';

interface Props {
  onCreated?: () => void;
}

const emptyDefaults: IncomeEntryFormValues = {
  depositDate: new Date().toISOString().slice(0, 10),
  amount: '',
  categoryId: undefined as unknown as number,
  attenderId: undefined,
  paymentMethodId: undefined as unknown as number,
  designatedFundId: undefined,
  notes: ''
};

export function IncomeQuickEntryForm({ onCreated }: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
    setError,
    setFocus
  } = useForm<IncomeEntryFormValues>({
    resolver: zodResolver(IncomeEntryFormSchema),
    defaultValues: emptyDefaults
  });

  const incomeCategories = useIncomeCategories();
  const { create } = useIncomeEntryMutations();

  const onSubmit = (values: IncomeEntryFormValues) => {
    const allCats = incomeCategories.data?.data ?? [];
    const selected = allCats.find((c) => c.id === values.categoryId);
    if (selected?.requiresMember && !values.attenderId) {
      setError('attenderId', { message: 'Congregado é obrigatório para esta categoria.' });
      return;
    }

    const body = {
      depositDate: values.depositDate,
      amount: Number.parseFloat(values.amount),
      categoryId: values.categoryId!,
      paymentMethodId: values.paymentMethodId!,
      ...(values.attenderId !== undefined ? { attenderId: values.attenderId } : {}),
      ...(values.designatedFundId !== undefined
        ? { designatedFundId: values.designatedFundId }
        : {}),
      ...(values.notes ? { notes: values.notes } : {})
    };

    create.mutate(body, {
      onSuccess: () => {
        const currentDate = getValues('depositDate');
        reset({ ...emptyDefaults, depositDate: currentDate });
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
          <IncomeEntryFields control={control} errors={errors} />

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
