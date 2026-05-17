import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import EntityPicker from '@/components/EntityPicker';
import {
  UserCreateFormSchema,
  UserEditFormSchema,
  type UserCreateFormValues,
  type UserEditFormValues,
  type UserResponse
} from '@/schemas/user';
import type { RoleResponse } from '@/schemas/role';
import type { AttenderResponse } from '@/schemas/attender';
import { useRoles } from '@/modules/roles/useRoles';
import { useAttenders } from '@/modules/attenders/useAttenders';

interface UserFormProps {
  initialValues?: UserResponse;
  isPending: boolean;
  onSubmit: (values: UserCreateFormValues | UserEditFormValues) => void;
  onCancel: () => void;
  formRef?: React.MutableRefObject<{
    createForm: ReturnType<typeof useForm<UserCreateFormValues>> | null;
    editForm: ReturnType<typeof useForm<UserEditFormValues>> | null;
  } | null>;
}

export default function UserForm({
  initialValues,
  isPending,
  onSubmit,
  onCancel,
  formRef
}: UserFormProps) {
  const isEditing = initialValues !== undefined;

  const rolesList = useRoles();
  const roles = rolesList.data?.data ?? [];

  const attendersList = useAttenders();
  const attenders = attendersList.data?.data ?? [];

  const createForm = useForm<UserCreateFormValues>({
    resolver: zodResolver(UserCreateFormSchema),
    defaultValues: { name: '', email: '', attenderId: null }
  });

  const editForm = useForm<UserEditFormValues>({
    resolver: zodResolver(UserEditFormSchema),
    defaultValues: initialValues
      ? { name: initialValues.name, email: initialValues.email, roleId: initialValues.roleId }
      : {}
  });

  useEffect(() => {
    // Populate form ref for error handling from parent
    if (formRef) {
      formRef.current = { createForm, editForm };
    }

    if (isEditing && initialValues) {
      editForm.reset({
        name: initialValues.name,
        email: initialValues.email,
        roleId: initialValues.roleId
      });
    } else {
      createForm.reset({
        name: '',
        email: '',
        attenderId: null
      });
    }
  }, [initialValues, isEditing, editForm, createForm, formRef]);

  if (isEditing) {
    const {
      register,
      handleSubmit,
      control,
      formState: { errors }
    } = editForm;
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="edit-name">Nome</Label>
          <Input id="edit-name" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="edit-email">E-mail</Label>
          <Input id="edit-email" type="email" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>Cargo</Label>
          <Controller
            name="roleId"
            control={control}
            render={({ field }) => (
              <EntityPicker<RoleResponse>
                items={roles}
                value={field.value ?? null}
                onChange={(v) => field.onChange(v)}
                getValue={(r) => r.id}
                getLabel={(r) => r.name}
                placeholder="Selecionar cargo..."
                isLoading={rolesList.isLoading}
              />
            )}
          />
          {errors.roleId && <p className="text-xs text-destructive">{errors.roleId.message}</p>}
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

  const {
    register,
    handleSubmit,
    control,
    formState: { errors }
  } = createForm;
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="create-name">Nome *</Label>
        <Input id="create-name" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="create-email">E-mail *</Label>
        <Input id="create-email" type="email" {...register('email')} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-1">
        <Label>Cargo *</Label>
        <Controller
          name="roleId"
          control={control}
          render={({ field }) => (
            <EntityPicker<RoleResponse>
              items={roles}
              value={field.value ?? null}
              onChange={(v) => field.onChange(v)}
              getValue={(r) => r.id}
              getLabel={(r) => r.name}
              placeholder="Selecionar cargo..."
              isLoading={rolesList.isLoading}
            />
          )}
        />
        {errors.roleId && <p className="text-xs text-destructive">{errors.roleId.message}</p>}
      </div>
      <div className="space-y-1">
        <Label>Congregado (opcional)</Label>
        <Controller
          name="attenderId"
          control={control}
          render={({ field }) => (
            <EntityPicker<AttenderResponse>
              items={attenders}
              value={field.value ?? null}
              onChange={(v) => field.onChange(v)}
              getValue={(a) => a.id}
              getLabel={(a) => a.name}
              placeholder="Vincular a um congregado..."
              isLoading={attendersList.isLoading}
              allowClear
            />
          )}
        />
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
