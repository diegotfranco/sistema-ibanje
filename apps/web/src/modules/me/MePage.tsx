import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { useAttenderProfile, useUpdateMyProfile } from './useMyProfile';
import { useMyDonations } from '@/modules/donations/useDonations';
import DonationsTable from '@/modules/donations/DonationsTable';
import { UpdateMyProfileFormSchema, type UpdateMyProfileFormValues } from '@/schemas/me';

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
  const { data: attender } = useAttenderProfile(
    currentUser?.attenderId ?? null
  );
  const [donationsPage, setDonationsPage] = useState(1);
  const donationLimit = 10;
  const donations = useMyDonations(donationsPage, donationLimit);

  const updateProfile = useUpdateMyProfile();

  const form = useForm<UpdateMyProfileFormValues>({
    resolver: zodResolver(UpdateMyProfileFormSchema),
    defaultValues: EMPTY
  });

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = form;

  function onSubmitProfile(values: UpdateMyProfileFormValues) {
    const cleanValues = {
      phone: values.phone && values.phone !== '' ? values.phone : undefined,
      email: values.email && values.email !== '' ? values.email : undefined,
      addressStreet: values.addressStreet && values.addressStreet !== '' ? values.addressStreet : undefined,
      addressNumber: values.addressNumber,
      addressComplement: values.addressComplement && values.addressComplement !== '' ? values.addressComplement : undefined,
      addressDistrict: values.addressDistrict && values.addressDistrict !== '' ? values.addressDistrict : undefined,
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
                    <p className="text-sm font-medium">
                      {new Date(attender.memberSince).toLocaleDateString('pt-BR')}
                    </p>
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
                  defaultValue={attender?.email || ''}
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={attender?.phone || '(11) 99999-9999'}
                  defaultValue={attender?.phone || ''}
                  {...register('phone')}
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="addressStreet">Rua</Label>
              <Input
                id="addressStreet"
                placeholder={attender?.addressStreet || 'Nome da rua'}
                defaultValue={attender?.addressStreet || ''}
                {...register('addressStreet')}
                className={errors.addressStreet ? 'border-red-500' : ''}
              />
              {errors.addressStreet && (
                <p className="text-xs text-red-500 mt-1">{errors.addressStreet.message}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="addressNumber">Número</Label>
                <Input
                  id="addressNumber"
                  type="number"
                  placeholder={attender?.addressNumber?.toString() || '123'}
                  defaultValue={attender?.addressNumber || ''}
                  {...register('addressNumber', { valueAsNumber: true })}
                  className={errors.addressNumber ? 'border-red-500' : ''}
                />
                {errors.addressNumber && (
                  <p className="text-xs text-red-500 mt-1">{errors.addressNumber.message}</p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="addressComplement">Complemento</Label>
                <Input
                  id="addressComplement"
                  placeholder={attender?.addressComplement || 'Apto, sala, etc.'}
                  defaultValue={attender?.addressComplement || ''}
                  {...register('addressComplement')}
                  className={errors.addressComplement ? 'border-red-500' : ''}
                />
                {errors.addressComplement && (
                  <p className="text-xs text-red-500 mt-1">{errors.addressComplement.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="addressDistrict">Bairro</Label>
              <Input
                id="addressDistrict"
                placeholder={attender?.addressDistrict || 'Nome do bairro'}
                defaultValue={attender?.addressDistrict || ''}
                {...register('addressDistrict')}
                className={errors.addressDistrict ? 'border-red-500' : ''}
              />
              {errors.addressDistrict && (
                <p className="text-xs text-red-500 mt-1">{errors.addressDistrict.message}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  placeholder={attender?.state || 'SP'}
                  defaultValue={attender?.state || ''}
                  maxLength={2}
                  {...register('state')}
                  className={errors.state ? 'border-red-500' : ''}
                />
                {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state.message}</p>}
              </div>

              <div className="col-span-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  placeholder={attender?.city || 'Nome da cidade'}
                  defaultValue={attender?.city || ''}
                  {...register('city')}
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="postalCode">CEP</Label>
              <Input
                id="postalCode"
                placeholder={attender?.postalCode || '12345678'}
                defaultValue={attender?.postalCode || ''}
                maxLength={8}
                {...register('postalCode')}
                className={errors.postalCode ? 'border-red-500' : ''}
              />
              {errors.postalCode && (
                <p className="text-xs text-red-500 mt-1">{errors.postalCode.message}</p>
              )}
            </div>

            <Button type="submit" disabled={updateProfile.isPending} className="w-full">
              {updateProfile.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Minhas Contribuições */}
      <Card>
        <CardHeader>
          <CardTitle>Minhas Contribuições</CardTitle>
        </CardHeader>
        <CardContent>
          {currentUser.attenderId === null ? (
            <p className="text-sm text-muted-foreground">
              Você ainda não está vinculado a um cadastro de Congregado. Procure a secretaria.
            </p>
          ) : (
            <DonationsTable
              data={donations.data?.data ?? []}
              page={donationsPage}
              total={donations.data?.total ?? 0}
              limit={donationLimit}
              onPageChange={setDonationsPage}
              loading={donations.isLoading}
              emptyMessage="Você ainda não possui nenhuma contribuição registrada."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
