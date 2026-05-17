import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RoleFormSchema, type RoleFormValues, type RoleResponse } from '@/schemas/role';

interface RoleFormProps {
  initialValues?: RoleResponse;
  isPending: boolean;
  onSubmit: (values: RoleFormValues) => void;
  onCancel: () => void;
}

const EMPTY: RoleFormValues = { name: '', description: '' };

export default function RoleForm({ initialValues, isPending, onSubmit, onCancel }: RoleFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<RoleFormValues>({
    resolver: zodResolver(RoleFormSchema),
    defaultValues: initialValues
      ? { name: initialValues.name, description: initialValues.description ?? '' }
      : EMPTY
  });

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
    <form onSubmit={handleSubmit((v) => onSubmit(prepare(v)))} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="name">Nome *</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" {...register('description')} rows={3} />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

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
