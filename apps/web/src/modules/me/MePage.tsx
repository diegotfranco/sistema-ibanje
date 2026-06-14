import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeaderRow, CardTitle } from '@/components/Card';
import { PageContainer } from '@/components/PageContainer';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/PasswordInput';
import { PasswordStrengthMeter, PasswordRequirements } from '@/components/PasswordStrengthBar';
import { PhoneInput, CepInput } from '@/components/MaskedInput';
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
    handleSubmit,
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
        onSubmit={passwordForm.handleSubmit(onSubmitPassword)}
        className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeaderRow>
            <CardTitle>Segurança</CardTitle>
          </CardHeaderRow>
          <CardContent className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="newPassword">Nova senha</Label>
              <PasswordInput
                id="newPassword"
                autoComplete="new-password"
                {...passwordForm.register('newPassword')}
                aria-invalid={!!passwordForm.formState.errors.newPassword || undefined}
              />
              <PasswordStrengthMeter value={passwordForm.watch('newPassword') ?? ''} />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-xs text-destructive mt-1">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                {...passwordForm.register('confirmPassword')}
                aria-invalid={!!passwordForm.formState.errors.confirmPassword || undefined}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive mt-1">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium leading-none">Requisitos</p>
              <div className="mt-2">
                <PasswordRequirements value={passwordForm.watch('newPassword') ?? ''} />
              </div>
            </div>

            <div>
              <Label htmlFor="currentPassword">Senha atual</Label>
              <PasswordInput
                id="currentPassword"
                autoComplete="current-password"
                {...passwordForm.register('currentPassword')}
                aria-invalid={!!passwordForm.formState.errors.currentPassword || undefined}
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-xs text-destructive mt-1">
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>
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

      <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4 sm:space-y-6">
        {/* Contato */}
        <Card>
          <CardHeaderRow>
            <CardTitle>Contato</CardTitle>
          </CardHeaderRow>
          <CardContent className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                aria-invalid={!!errors.email || undefined}
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
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
              {errors.phone && (
                <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeaderRow>
            <CardTitle>Endereço</CardTitle>
          </CardHeaderRow>
          <CardContent className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <Label htmlFor="addressStreet">Rua</Label>
              <Input
                id="addressStreet"
                {...register('addressStreet')}
                aria-invalid={!!errors.addressStreet || undefined}
              />
              {errors.addressStreet && (
                <p className="text-xs text-destructive mt-1">{errors.addressStreet.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="addressNumber">Número</Label>
              <Input
                id="addressNumber"
                maxLength={16}
                {...register('addressNumber')}
                aria-invalid={!!errors.addressNumber || undefined}
              />
              {errors.addressNumber && (
                <p className="text-xs text-destructive mt-1">{errors.addressNumber.message}</p>
              )}
            </div>

            <div className="sm:col-span-3">
              <Label htmlFor="addressComplement">Complemento</Label>
              <Input
                id="addressComplement"
                {...register('addressComplement')}
                aria-invalid={!!errors.addressComplement || undefined}
              />
              {errors.addressComplement && (
                <p className="text-xs text-destructive mt-1">{errors.addressComplement.message}</p>
              )}
            </div>

            <div className="sm:col-span-3">
              <Label htmlFor="addressDistrict">Bairro</Label>
              <Input
                id="addressDistrict"
                {...register('addressDistrict')}
                aria-invalid={!!errors.addressDistrict || undefined}
              />
              {errors.addressDistrict && (
                <p className="text-xs text-destructive mt-1">{errors.addressDistrict.message}</p>
              )}
            </div>

            <div className="sm:col-span-1">
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                maxLength={2}
                placeholder="UF"
                {...register('state')}
                aria-invalid={!!errors.state || undefined}
              />
              {errors.state && (
                <p className="text-xs text-destructive mt-1">{errors.state.message}</p>
              )}
            </div>

            <div className="sm:col-span-3">
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" {...register('city')} aria-invalid={!!errors.city || undefined} />
              {errors.city && (
                <p className="text-xs text-destructive mt-1">{errors.city.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="postalCode">CEP</Label>
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
              {errors.postalCode && (
                <p className="text-xs text-destructive mt-1">{errors.postalCode.message}</p>
              )}
            </div>
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
