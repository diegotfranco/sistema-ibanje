import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@/lib/zodResolver';
import {
  DesignatedFundFormSchema,
  type DesignatedFundFormValues,
  type DesignatedFundResponse
} from '@/schemas/designated-fund';

interface Props {
  initialValues?: DesignatedFundResponse;
  isPending: boolean;
  onSubmit: (values: DesignatedFundFormValues) => void;
  onCancel: () => void;
}

export function DesignatedFundForm({ initialValues, isPending, onSubmit, onCancel }: Props) {
  const form = useForm<DesignatedFundFormValues>({
    resolver: zodResolver(DesignatedFundFormSchema),
    defaultValues: {
      name: initialValues?.name ?? '',
      description: initialValues?.description ?? '',
      targetAmount: initialValues?.targetAmount ?? ''
    }
  });

  const handleSubmit = (values: DesignatedFundFormValues) => {
    const transformed = {
      ...values,
      description: values.description || undefined,
      targetAmount: values.targetAmount || undefined
    };
    onSubmit(transformed as DesignatedFundFormValues);
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
