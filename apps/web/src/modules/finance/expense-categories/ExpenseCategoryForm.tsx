import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CategoryParentPicker, type CategoryNode } from '@/components/CategoryParentPicker';
import { zodResolver } from '@/lib/zodResolver';
import {
  ExpenseCategoryFormSchema,
  type ExpenseCategoryFormValues,
  type ExpenseCategoryResponse
} from '@/schemas/expense-category';

interface Props {
  initialValues?: ExpenseCategoryResponse;
  categories: CategoryNode[];
  isPending: boolean;
  onSubmit: (values: ExpenseCategoryFormValues) => void;
  onCancel: () => void;
}

export function ExpenseCategoryForm({
  initialValues,
  categories,
  isPending,
  onSubmit,
  onCancel
}: Props) {
  const form = useForm<ExpenseCategoryFormValues>({
    resolver: zodResolver(ExpenseCategoryFormSchema),
    defaultValues: {
      name: initialValues?.name ?? '',
      description: initialValues?.description ?? '',
      parentId: initialValues?.parentId ?? undefined
    }
  });

  const handleSubmit = (values: ExpenseCategoryFormValues) => {
    const transformed = {
      ...values,
      description: values.description || undefined
    };
    onSubmit(transformed as ExpenseCategoryFormValues);
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
              <Input {...field} aria-invalid={fieldState.invalid} maxLength={64} />
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
          name="parentId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Categoria Pai</FieldLabel>
              <CategoryParentPicker
                value={field.value}
                onChange={field.onChange}
                options={categories}
                excludeId={initialValues?.id}
              />
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
