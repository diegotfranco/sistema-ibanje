import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/Button';
import { DialogFooter } from '@/components/Dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import DateInput from '@/components/DateInput';
import { zodResolver } from '@/lib/zodResolver';
import { CampaignFormSchema, type CampaignFormValues, type CampaignResponse } from './schema';

interface Props {
  initialValues?: CampaignResponse;
  isPending: boolean;
  onSubmit: (values: CampaignFormValues) => void;
  onCancel: () => void;
}

export function CampaignForm({ initialValues, isPending, onSubmit, onCancel }: Props) {
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(CampaignFormSchema),
    defaultValues: {
      name: initialValues?.name ?? '',
      description: initialValues?.description ?? '',
      targetAmount: initialValues?.targetAmount ?? '',
      targetDate: initialValues?.targetDate ?? null
    }
  });

  const handleSubmit = (values: CampaignFormValues) => {
    const transformed = {
      ...values,
      description: values.description || undefined,
      targetAmount: values.targetAmount || undefined,
      targetDate: values.targetDate || null
    };
    onSubmit(transformed as CampaignFormValues);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" noValidate>
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Nome</FieldLabel>
              <Input {...field} aria-invalid={fieldState.invalid} maxLength={96} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Descrição</FieldLabel>
              <Textarea {...field} aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="targetAmount"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Meta (R$)</FieldLabel>
              <Input {...field} aria-invalid={fieldState.invalid} placeholder="1000.00" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="targetDate"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Encerra em (opcional)</FieldLabel>
              <DateInput {...field} value={field.value || ''} aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
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
