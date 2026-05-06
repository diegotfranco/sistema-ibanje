import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogFooter } from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@/lib/zodResolver';
import {
  PaymentMethodFormSchema,
  type PaymentMethodFormValues,
  type PaymentMethodResponse
} from '@/schemas/payment-method';

interface Props {
  initialValues?: PaymentMethodResponse;
  isPending: boolean;
  onSubmit: (values: PaymentMethodFormValues) => void;
  onCancel: () => void;
}

export function PaymentMethodForm({ initialValues, isPending, onSubmit, onCancel }: Props) {
  const form = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(PaymentMethodFormSchema),
    defaultValues: {
      name: initialValues?.name ?? '',
      allowsInflow: initialValues?.allowsInflow ?? false,
      allowsOutflow: initialValues?.allowsOutflow ?? false
    }
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Nome</FieldLabel>
              <Input {...field} aria-invalid={fieldState.invalid} maxLength={64} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="allowsInflow"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field orientation="horizontal" data-invalid={fieldState.invalid}>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                className="cursor-pointer"
              />
              <FieldLabel className="cursor-pointer">Permite entrada</FieldLabel>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="allowsOutflow"
          control={form.control}
          render={({ field }) => (
            <Field orientation="horizontal">
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                className="cursor-pointer"
              />
              <FieldLabel className="cursor-pointer">Permite saída</FieldLabel>
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
