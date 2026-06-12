import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { zodResolver } from '@/lib/zodResolver';
import { Button } from '@/components/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import EntityPicker from '@/components/EntityPicker';
import {
  UserCreateFormSchema,
  UserEditFormSchema,
  type UserCreateFormValues,
  type UserEditFormValues,
  type UserResponse
} from './schema';
import type { RoleResponse } from '../roles/schema';
import type { AttenderResponse } from '../attenders/schema';
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

  // Only members can hold a login, so the picker (and the email-match warning below) work off the
  // member roster. Server caps the page at 100 — fine for a single church; the email-match toast
  // is best-effort and the backend independently blocks non-member email collisions.
  const attendersList = useAttenders({ isMember: 'true', limit: 100 });
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

  // When the typed email belongs to a member who wasn't linked, nudge the operator to link them
  // instead of creating a detached account. Non-blocking — the backend enforces the hard rules.
  function warnOnUnlinkedMemberEmail(rawEmail: string) {
    const email = rawEmail.trim().toLowerCase();
    if (!email || createForm.getValues('attenderId')) return;
    const match = attenders.find((a) => a.email?.toLowerCase() === email);
    if (match) {
      toast.warning(`Existe um membro com este e-mail (${match.name}). Considere vinculá-lo.`);
    }
  }

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
        {(() => {
          const emailField = register('email');
          return (
            <Input
              id="create-email"
              type="email"
              {...emailField}
              onBlur={(e) => {
                emailField.onBlur(e);
                warnOnUnlinkedMemberEmail(e.target.value);
              }}
            />
          );
        })()}
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
        <Label>Membro (opcional)</Label>
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
              placeholder="Vincular a um membro..."
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
