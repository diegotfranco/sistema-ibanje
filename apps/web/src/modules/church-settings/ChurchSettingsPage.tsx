import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useChurchSettings, useUpdateChurchSettings } from './useChurchSettings';
import type { ChurchSettingsFormValues } from '@/schemas/church-settings';
import { ChurchSettingsFormSchema } from '@/schemas/church-settings';

export default function ChurchSettingsPage() {
  const { data: churchSettings, isLoading } = useChurchSettings();
  const updateMutation = useUpdateChurchSettings();

  const EMPTY: ChurchSettingsFormValues = {
    name: '',
    cnpj: '',
    addressStreet: '',
    addressNumber: '',
    addressDistrict: '',
    addressCity: '',
    addressState: '',
    postalCode: '',
    phone: '',
    email: '',
    websiteUrl: '',
    currentPresidentName: '',
    currentPresidentTitle: '',
    currentSecretaryName: '',
    currentSecretaryTitle: ''
  };

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<ChurchSettingsFormValues>({
    resolver: zodResolver(ChurchSettingsFormSchema),
    defaultValues: churchSettings
      ? {
          name: churchSettings.name,
          cnpj: churchSettings.cnpj || '',
          addressStreet: churchSettings.addressStreet,
          addressNumber: churchSettings.addressNumber,
          addressDistrict: churchSettings.addressDistrict,
          addressCity: churchSettings.addressCity,
          addressState: churchSettings.addressState,
          postalCode: churchSettings.postalCode,
          phone: churchSettings.phone || '',
          email: churchSettings.email || '',
          websiteUrl: churchSettings.websiteUrl || '',
          currentPresidentName: churchSettings.currentPresidentName || '',
          currentPresidentTitle: churchSettings.currentPresidentTitle || '',
          currentSecretaryName: churchSettings.currentSecretaryName || '',
          currentSecretaryTitle: churchSettings.currentSecretaryTitle || ''
        }
      : EMPTY
  });

  function onSubmit(values: ChurchSettingsFormValues) {
    updateMutation.mutate(values);
  }

  if (isLoading) {
    return <div className="p-4">Carregando...</div>;
  }

  function renderError(name: keyof ChurchSettingsFormValues) {
    const error = errors[name];
    return error ? <p className="text-sm text-red-500 mt-1">{error.message}</p> : null;
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Identificação */}
        <Card>
          <CardHeader>
            <CardTitle>Identificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Controller
                control={control}
                name="name"
                render={({ field }) => <Input {...field} id="name" />}
              />
              {renderError('name')}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Controller
                  control={control}
                  name="cnpj"
                  render={({ field }) => <Input {...field} id="cnpj" />}
                />
                {renderError('cnpj')}
              </div>

              <div>
                <Label htmlFor="postalCode">Código Postal</Label>
                <Controller
                  control={control}
                  name="postalCode"
                  render={({ field }) => <Input {...field} id="postalCode" maxLength={8} />}
                />
                {renderError('postalCode')}
              </div>
            </div>

            <div>
              <Label htmlFor="addressStreet">Rua</Label>
              <Controller
                control={control}
                name="addressStreet"
                render={({ field }) => <Input {...field} id="addressStreet" />}
              />
              {renderError('addressStreet')}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="addressNumber">Número</Label>
                <Controller
                  control={control}
                  name="addressNumber"
                  render={({ field }) => <Input {...field} id="addressNumber" />}
                />
                {renderError('addressNumber')}
              </div>

              <div>
                <Label htmlFor="addressDistrict">Bairro</Label>
                <Controller
                  control={control}
                  name="addressDistrict"
                  render={({ field }) => <Input {...field} id="addressDistrict" />}
                />
                {renderError('addressDistrict')}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="addressCity">Cidade</Label>
                <Controller
                  control={control}
                  name="addressCity"
                  render={({ field }) => <Input {...field} id="addressCity" />}
                />
                {renderError('addressCity')}
              </div>

              <div>
                <Label htmlFor="addressState">Estado</Label>
                <Controller
                  control={control}
                  name="addressState"
                  render={({ field }) => <Input {...field} id="addressState" maxLength={2} />}
                />
                {renderError('addressState')}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle>Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field }) => <Input {...field} id="phone" type="tel" />}
                />
                {renderError('phone')}
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Controller
                  control={control}
                  name="email"
                  render={({ field }) => <Input {...field} id="email" type="email" />}
                />
                {renderError('email')}
              </div>
            </div>

            <div>
              <Label htmlFor="websiteUrl">URL do Site</Label>
              <Controller
                control={control}
                name="websiteUrl"
                render={({ field }) => <Input {...field} id="websiteUrl" type="url" />}
              />
              {renderError('websiteUrl')}
            </div>
          </CardContent>
        </Card>

        {/* Diretoria Atual */}
        <Card>
          <CardHeader>
            <CardTitle>Diretoria Atual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentPresidentName">Nome do Presidente</Label>
                <Controller
                  control={control}
                  name="currentPresidentName"
                  render={({ field }) => <Input {...field} id="currentPresidentName" />}
                />
                {renderError('currentPresidentName')}
              </div>

              <div>
                <Label htmlFor="currentPresidentTitle">Título do Presidente</Label>
                <Controller
                  control={control}
                  name="currentPresidentTitle"
                  render={({ field }) => <Input {...field} id="currentPresidentTitle" />}
                />
                {renderError('currentPresidentTitle')}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentSecretaryName">Nome do Secretário</Label>
                <Controller
                  control={control}
                  name="currentSecretaryName"
                  render={({ field }) => <Input {...field} id="currentSecretaryName" />}
                />
                {renderError('currentSecretaryName')}
              </div>

              <div>
                <Label htmlFor="currentSecretaryTitle">Título do Secretário</Label>
                <Controller
                  control={control}
                  name="currentSecretaryTitle"
                  render={({ field }) => <Input {...field} id="currentSecretaryTitle" />}
                />
                {renderError('currentSecretaryTitle')}
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={updateMutation.isPending} className="w-full">
          {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>
    </div>
  );
}
