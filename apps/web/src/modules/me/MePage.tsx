import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { autofillSafeSubmit } from '@/lib/forms';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeaderRow, CardTitle } from '@/components/Card';
import { PageContainer } from '@/components/PageContainer';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/PasswordInput';
import { PasswordStrengthMeter, PasswordRequirements } from '@/components/PasswordStrengthBar';
import { PhoneInput, CepInput } from '@/components/MaskedInput';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { formatMonthYear } from '@/lib/datetime';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { useAttenderProfile, useUpdateMyProfile, useChangeMyPassword } from './useMyProfile';
import {
  UpdateMyProfileFormSchema,
  type UpdateMyProfileFormValues,
  ChangeMyPasswordFormSchema,
  type ChangeMyPasswordFormValues
} from './schema';

const EMPTY: UpdateMyProfileFormValues = {
  phone: '',
  email: '',
  addressStreet: '',
  addressNumber: undefined,
  addressComplement: '',
  addressDistrict: '',
  state: '',
  city: '',
  postalCode: ''
};

const EMPTY_PASSWORD: ChangeMyPasswordFormValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
};

export default function MePage() {
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: attender } = useAttenderProfile(currentUser?.attenderId ?? null);

  const updateProfile = useUpdateMyProfile();
  const changePassword = useChangeMyPassword(currentUser?.id);

  const form = useForm<UpdateMyProfileFormValues>({
    resolver: zodResolver(UpdateMyProfileFormSchema),
    defaultValues: EMPTY,
    // `values` re-syncs the form once the async profile query resolves; phone/postalCode are
    // stored as raw digits and rendered formatted by the masked inputs.
    values: attender
      ? {
          phone: attender.phone ?? '',
          email: attender.email ?? '',
          addressStreet: attender.addressStreet ?? '',
          addressNumber: attender.addressNumber ?? '',
          addressComplement: attender.addressComplement ?? '',
          addressDistrict: attender.addressDistrict ?? '',
          state: attender.state ?? '',
          city: attender.city ?? '',
          postalCode: attender.postalCode ?? ''
        }
      : undefined
  });

  const {
    register,
    control,
    formState: { errors }
  } = form;

  const passwordForm = useForm<ChangeMyPasswordFormValues>({
    resolver: zodResolver(ChangeMyPasswordFormSchema),
    defaultValues: EMPTY_PASSWORD
  });

  function onSubmitProfile(values: UpdateMyProfileFormValues) {
    const cleanValues = {
      phone: values.phone && values.phone !== '' ? values.phone : undefined,
      email: values.email && values.email !== '' ? values.email : undefined,
      addressStreet:
        values.addressStreet && values.addressStreet !== '' ? values.addressStreet : undefined,
      addressNumber: values.addressNumber,
      addressComplement:
        values.addressComplement && values.addressComplement !== ''
          ? values.addressComplement
          : undefined,
      addressDistrict:
        values.addressDistrict && values.addressDistrict !== ''
          ? values.addressDistrict
          : undefined,
      state: values.state && values.state !== '' ? values.state : undefined,
      city: values.city && values.city !== '' ? values.city : undefined,
      postalCode: values.postalCode && values.postalCode !== '' ? values.postalCode : undefined
    };

    updateProfile.mutate(cleanValues as UpdateMyProfileFormValues);
  }

  function onSubmitPassword(values: ChangeMyPasswordFormValues) {
    changePassword.mutate(values, { onSuccess: () => passwordForm.reset(EMPTY_PASSWORD) });
  }

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-muted-foreground">Erro ao carregar usuário.</p>
      </div>
    );
  }

  return (
    <PageContainer>
      <h1 className="text-2xl font-semibold text-primary-soft">Meu Perfil</h1>

      {/* Identificação — read-only */}
      {attender && (
        <Card>
          <CardHeaderRow>
            <CardTitle>Identificação</CardTitle>
          </CardHeaderRow>
          <CardContent className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-3">
            <div>
              <Label className="text-xs text-muted-foreground">Nome</Label>
              <p className="text-sm font-medium">{attender.name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Membro</Label>
              <p className="text-sm font-medium">{attender.isMember ? 'Sim' : 'Não'}</p>
            </div>
            {attender.isMember && attender.memberSince && (
              <div>
                <Label className="text-xs text-muted-foreground">Membro desde</Label>
                <p className="text-sm font-medium">{formatMonthYear(attender.memberSince)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Segurança — password change (independent form) */}
      <form
        onSubmit={autofillSafeSubmit(passwordForm, onSubmitPassword)}
        className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeaderRow>
            <CardTitle>Segurança</CardTitle>
          </CardHeaderRow>
          <CardContent className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
            <Field data-invalid={!!passwordForm.formState.errors.newPassword || undefined}>
              <FieldLabel htmlFor="newPassword">Nova senha</FieldLabel>
              <PasswordInput
                id="newPassword"
                autoComplete="new-password"
                {...passwordForm.register('newPassword')}
                aria-invalid={!!passwordForm.formState.errors.newPassword || undefined}
              />
              <PasswordStrengthMeter value={passwordForm.watch('newPassword') ?? ''} />
              {passwordForm.formState.errors.newPassword && (
                <FieldError errors={[passwordForm.formState.errors.newPassword]} />
              )}
            </Field>

            <Field data-invalid={!!passwordForm.formState.errors.confirmPassword || undefined}>
              <FieldLabel htmlFor="confirmPassword">Confirmar nova senha</FieldLabel>
              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                {...passwordForm.register('confirmPassword')}
                aria-invalid={!!passwordForm.formState.errors.confirmPassword || undefined}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <FieldError errors={[passwordForm.formState.errors.confirmPassword]} />
              )}
            </Field>

            <div>
              <p className="text-sm font-medium leading-none">Requisitos</p>
              <div className="mt-2">
                <PasswordRequirements value={passwordForm.watch('newPassword') ?? ''} />
              </div>
            </div>

            <Field data-invalid={!!passwordForm.formState.errors.currentPassword || undefined}>
              <FieldLabel htmlFor="currentPassword">Senha atual</FieldLabel>
              <PasswordInput
                id="currentPassword"
                autoComplete="current-password"
                {...passwordForm.register('currentPassword')}
                aria-invalid={!!passwordForm.formState.errors.currentPassword || undefined}
              />
              {passwordForm.formState.errors.currentPassword && (
                <FieldError errors={[passwordForm.formState.errors.currentPassword]} />
              )}
            </Field>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={changePassword.isPending}
            className="w-full sm:w-auto sm:min-w-32">
            {changePassword.isPending ? 'Alterando...' : 'Alterar senha'}
          </Button>
        </div>
      </form>

      <form onSubmit={autofillSafeSubmit(form, onSubmitProfile)} className="space-y-4 sm:space-y-6">
        {/* Contato */}
        <Card>
          <CardHeaderRow>
            <CardTitle>Contato</CardTitle>
          </CardHeaderRow>
          <CardContent className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.email || undefined}>
              <FieldLabel htmlFor="email">E-mail</FieldLabel>
              <Input
                id="email"
                type="email"
                {...register('email')}
                aria-invalid={!!errors.email || undefined}
              />
              {errors.email && <FieldError errors={[errors.email]} />}
            </Field>

            <Field data-invalid={!!errors.phone || undefined}>
              <FieldLabel htmlFor="phone">Telefone</FieldLabel>
              <Controller
                control={control}
                name="phone"
                render={({ field, fieldState }) => (
                  <PhoneInput
                    id="phone"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    name={field.name}
                    aria-invalid={fieldState.invalid || undefined}
                  />
                )}
              />
              {errors.phone && <FieldError errors={[errors.phone]} />}
            </Field>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeaderRow>
            <CardTitle>Endereço</CardTitle>
          </CardHeaderRow>
          <CardContent className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-6">
            <Field className="sm:col-span-4" data-invalid={!!errors.addressStreet || undefined}>
              <FieldLabel htmlFor="addressStreet">Rua</FieldLabel>
              <Input
                id="addressStreet"
                {...register('addressStreet')}
                aria-invalid={!!errors.addressStreet || undefined}
              />
              {errors.addressStreet && <FieldError errors={[errors.addressStreet]} />}
            </Field>

            <Field className="sm:col-span-2" data-invalid={!!errors.addressNumber || undefined}>
              <FieldLabel htmlFor="addressNumber">Número</FieldLabel>
              <Input
                id="addressNumber"
                maxLength={16}
                {...register('addressNumber')}
                aria-invalid={!!errors.addressNumber || undefined}
              />
              {errors.addressNumber && <FieldError errors={[errors.addressNumber]} />}
            </Field>

            <Field className="sm:col-span-3" data-invalid={!!errors.addressComplement || undefined}>
              <FieldLabel htmlFor="addressComplement">Complemento</FieldLabel>
              <Input
                id="addressComplement"
                {...register('addressComplement')}
                aria-invalid={!!errors.addressComplement || undefined}
              />
              {errors.addressComplement && <FieldError errors={[errors.addressComplement]} />}
            </Field>

            <Field className="sm:col-span-3" data-invalid={!!errors.addressDistrict || undefined}>
              <FieldLabel htmlFor="addressDistrict">Bairro</FieldLabel>
              <Input
                id="addressDistrict"
                {...register('addressDistrict')}
                aria-invalid={!!errors.addressDistrict || undefined}
              />
              {errors.addressDistrict && <FieldError errors={[errors.addressDistrict]} />}
            </Field>

            <Field className="sm:col-span-1" data-invalid={!!errors.state || undefined}>
              <FieldLabel htmlFor="state">Estado</FieldLabel>
              <Input
                id="state"
                maxLength={2}
                placeholder="UF"
                {...register('state')}
                aria-invalid={!!errors.state || undefined}
              />
              {errors.state && <FieldError errors={[errors.state]} />}
            </Field>

            <Field className="sm:col-span-3" data-invalid={!!errors.city || undefined}>
              <FieldLabel htmlFor="city">Cidade</FieldLabel>
              <Input id="city" {...register('city')} aria-invalid={!!errors.city || undefined} />
              {errors.city && <FieldError errors={[errors.city]} />}
            </Field>

            <Field className="sm:col-span-2" data-invalid={!!errors.postalCode || undefined}>
              <FieldLabel htmlFor="postalCode">CEP</FieldLabel>
              <Controller
                control={control}
                name="postalCode"
                render={({ field, fieldState }) => (
                  <CepInput
                    id="postalCode"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    name={field.name}
                    aria-invalid={fieldState.invalid || undefined}
                  />
                )}
              />
              {errors.postalCode && <FieldError errors={[errors.postalCode]} />}
            </Field>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={updateProfile.isPending}
            className="w-full sm:w-auto sm:min-w-32">
            {updateProfile.isPending ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
