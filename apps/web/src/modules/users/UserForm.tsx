import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { zodResolver } from '@/lib/zodResolver';
import { autofillSafeSubmit } from '@/lib/forms';
import { Button } from '@/components/Button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
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
      control,
      formState: { errors }
    } = editForm;
    return (
      <form onSubmit={autofillSafeSubmit(editForm, onSubmit)} className="space-y-4">
        <Field data-invalid={!!errors.name || undefined}>
          <FieldLabel htmlFor="edit-name">Nome</FieldLabel>
          <Input id="edit-name" {...register('name')} aria-invalid={!!errors.name || undefined} />
          {errors.name && <FieldError errors={[errors.name]} />}
        </Field>
        <Field data-invalid={!!errors.email || undefined}>
          <FieldLabel htmlFor="edit-email">E-mail</FieldLabel>
          <Input
            id="edit-email"
            type="email"
            {...register('email')}
            aria-invalid={!!errors.email || undefined}
          />
          {errors.email && <FieldError errors={[errors.email]} />}
        </Field>
        <Field data-invalid={!!errors.roleId || undefined}>
          <FieldLabel>Cargo</FieldLabel>
          <Controller
            name="roleId"
            control={control}
            render={({ field, fieldState }) => (
              <EntityPicker<RoleResponse>
                items={roles}
                value={field.value ?? null}
                onChange={(v) => field.onChange(v)}
                getValue={(r) => r.id}
                getLabel={(r) => r.name}
                placeholder="Selecionar cargo..."
                isLoading={rolesList.isLoading}
                aria-invalid={fieldState.invalid || undefined}
              />
            )}
          />
          {errors.roleId && <FieldError errors={[errors.roleId]} />}
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

  const {
    register,
    control,
    formState: { errors }
  } = createForm;
  return (
    <form onSubmit={autofillSafeSubmit(createForm, onSubmit)} className="space-y-4">
      <Field data-invalid={!!errors.name || undefined}>
        <FieldLabel htmlFor="create-name">Nome *</FieldLabel>
        <Input id="create-name" {...register('name')} aria-invalid={!!errors.name || undefined} />
        {errors.name && <FieldError errors={[errors.name]} />}
      </Field>
      <Field data-invalid={!!errors.email || undefined}>
        <FieldLabel htmlFor="create-email">E-mail *</FieldLabel>
        {(() => {
          const emailField = register('email');
          return (
            <Input
              id="create-email"
              type="email"
              {...emailField}
              aria-invalid={!!errors.email || undefined}
              onBlur={(e) => {
                emailField.onBlur(e);
                warnOnUnlinkedMemberEmail(e.target.value);
              }}
            />
          );
        })()}
        {errors.email && <FieldError errors={[errors.email]} />}
      </Field>
      <Field data-invalid={!!errors.roleId || undefined}>
        <FieldLabel>Cargo *</FieldLabel>
        <Controller
          name="roleId"
          control={control}
          render={({ field, fieldState }) => (
            <EntityPicker<RoleResponse>
              items={roles}
              value={field.value ?? null}
              onChange={(v) => field.onChange(v)}
              getValue={(r) => r.id}
              getLabel={(r) => r.name}
              placeholder="Selecionar cargo..."
              isLoading={rolesList.isLoading}
              aria-invalid={fieldState.invalid || undefined}
            />
          )}
        />
        {errors.roleId && <FieldError errors={[errors.roleId]} />}
      </Field>
      <Field>
        <FieldLabel>Membro</FieldLabel>
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
