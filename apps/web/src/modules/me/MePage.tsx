import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Input } from '@/components/ui/input';
import { PhoneInput, CepInput } from '@/components/MaskedInput';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { formatMonthYear } from '@/lib/datetime';
import { formatPhone } from '@/lib/format';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { useAttenderProfile, useUpdateMyProfile } from './useMyProfile';
import { UpdateMyProfileFormSchema, type UpdateMyProfileFormValues } from './schema';

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

export default function MePage() {
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: attender } = useAttenderProfile(currentUser?.attenderId ?? null);

  const updateProfile = useUpdateMyProfile();

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
    <div className="space-y-6 max-w-2xl">
      {/* Meu Perfil */}
      <Card>
        <CardHeader>
          <CardTitle>Meu Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Read-only header */}
          {attender && (
            <>
              <div className="grid grid-cols-2 gap-4">
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
              </div>
              <Separator />
            </>
          )}

          {/* Editable form */}
          <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={attender?.email || 'seu@email.com'}
                  {...register('email')}
                  className={errors.email ? 'border-destructive' : ''}
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
                  render={({ field }) => (
                    <PhoneInput
                      id="phone"
                      placeholder={
                        attender?.phone ? formatPhone(attender.phone) : '(11) 99999-9999'
                      }
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                      name={field.name}
                      className={errors.phone ? 'border-destructive' : ''}
                    />
                  )}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="addressStreet">Rua</Label>
              <Input
                id="addressStreet"
                placeholder={attender?.addressStreet || 'Nome da rua'}
                {...register('addressStreet')}
                className={errors.addressStreet ? 'border-destructive' : ''}
              />
              {errors.addressStreet && (
                <p className="text-xs text-destructive mt-1">{errors.addressStreet.message}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="addressNumber">Número</Label>
                <Input
                  id="addressNumber"
                  maxLength={16}
                  placeholder={attender?.addressNumber ?? '123'}
                  {...register('addressNumber')}
                  className={errors.addressNumber ? 'border-destructive' : ''}
                />
                {errors.addressNumber && (
                  <p className="text-xs text-destructive mt-1">{errors.addressNumber.message}</p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="addressComplement">Complemento</Label>
                <Input
                  id="addressComplement"
                  placeholder={attender?.addressComplement || 'Apto, sala, etc.'}
                  {...register('addressComplement')}
                  className={errors.addressComplement ? 'border-destructive' : ''}
                />
                {errors.addressComplement && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.addressComplement.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="addressDistrict">Bairro</Label>
              <Input
                id="addressDistrict"
                placeholder={attender?.addressDistrict || 'Nome do bairro'}
                {...register('addressDistrict')}
                className={errors.addressDistrict ? 'border-destructive' : ''}
              />
              {errors.addressDistrict && (
                <p className="text-xs text-destructive mt-1">{errors.addressDistrict.message}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  placeholder={attender?.state || 'SP'}
                  maxLength={2}
                  {...register('state')}
                  className={errors.state ? 'border-destructive' : ''}
                />
                {errors.state && (
                  <p className="text-xs text-destructive mt-1">{errors.state.message}</p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  placeholder={attender?.city || 'Nome da cidade'}
                  {...register('city')}
                  className={errors.city ? 'border-destructive' : ''}
                />
                {errors.city && (
                  <p className="text-xs text-destructive mt-1">{errors.city.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="postalCode">CEP</Label>
              <Controller
                control={control}
                name="postalCode"
                render={({ field }) => (
                  <CepInput
                    id="postalCode"
                    placeholder={attender?.postalCode || '00000-000'}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    name={field.name}
                    className={errors.postalCode ? 'border-destructive' : ''}
                  />
                )}
              />
              {errors.postalCode && (
                <p className="text-xs text-destructive mt-1">{errors.postalCode.message}</p>
              )}
            </div>

            <Button type="submit" disabled={updateProfile.isPending} className="w-full">
              {updateProfile.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
