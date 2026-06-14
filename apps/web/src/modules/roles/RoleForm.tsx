import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { autofillSafeSubmit } from '@/lib/forms';
import { Button } from '@/components/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { RoleFormSchema, type RoleFormValues, type RoleResponse } from './schema';

interface RoleFormProps {
  initialValues?: RoleResponse;
  isPending: boolean;
  onSubmit: (values: RoleFormValues) => void;
  onCancel: () => void;
}

const EMPTY: RoleFormValues = { name: '', description: '' };

export default function RoleForm({ initialValues, isPending, onSubmit, onCancel }: RoleFormProps) {
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(RoleFormSchema),
    defaultValues: initialValues
      ? { name: initialValues.name, description: initialValues.description ?? '' }
      : EMPTY
  });
  const {
    register,
    reset,
    formState: { errors }
  } = form;

  useEffect(() => {
    reset(
      initialValues
        ? { name: initialValues.name, description: initialValues.description ?? '' }
        : EMPTY
    );
  }, [initialValues, reset]);

  function prepare(values: RoleFormValues): RoleFormValues {
    return {
      ...values,
      description: values.description?.trim() || undefined
    };
  }

  return (
    <form onSubmit={autofillSafeSubmit(form, (v) => onSubmit(prepare(v)))} className="space-y-4">
      <Field data-invalid={!!errors.name || undefined}>
        <FieldLabel htmlFor="name">Nome *</FieldLabel>
        <Input id="name" {...register('name')} />
        {errors.name && <FieldError errors={[errors.name]} />}
      </Field>

      <Field data-invalid={!!errors.description || undefined}>
        <FieldLabel htmlFor="description">Descrição</FieldLabel>
        <Textarea id="description" {...register('description')} rows={3} />
        {errors.description && <FieldError errors={[errors.description]} />}
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}
