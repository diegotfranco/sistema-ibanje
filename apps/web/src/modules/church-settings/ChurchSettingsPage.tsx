import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { Button } from '@/components/Button';
import { PageContainer } from '@/components/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Field, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { CnpjInput, CepInput, PhoneInput } from '@/components/MaskedInput';
import { useChurchSettings, useUpdateChurchSettings } from './useChurchSettings';
import { LogoField } from './LogoField';
import { FinanceSettingsCard } from '@/modules/finance/finance-settings/FinanceSettingsCard';
import type { ChurchSettingsFormValues } from './schema';
import { ChurchSettingsFormSchema } from './schema';

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
    defaultValues: EMPTY,
    // `values` (not `defaultValues`) so the form re-syncs once the async settings query resolves —
    // react-hook-form only reads `defaultValues` at mount, which on a cold load is still EMPTY.
    values: churchSettings
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
      : undefined
  });

  function onSubmit(values: ChurchSettingsFormValues) {
    updateMutation.mutate(values);
  }

  if (isLoading) {
    return (
      <PageContainer>
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="space-y-3 py-8">
              <div className="h-5 w-40 animate-pulse rounded bg-muted" />
              <div className="h-9 w-full animate-pulse rounded bg-muted" />
              <div className="h-9 w-2/3 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Logo — uploaded independently of the form (immediate upload/remove) */}
      <Card>
        <CardHeader>
          <CardTitle className="py-0.75">Logo</CardTitle>
        </CardHeader>
        <CardContent className="mt-4">
          <LogoField
            logoPath={churchSettings?.logoPath ?? null}
            version={churchSettings?.updatedAt ?? ''}
          />
          <FieldDescription className="mt-3">
            Aparece no cabeçalho dos documentos impressos (atas, demonstrativos, cartas). PNG ou
            JPEG, até 5 MB.
          </FieldDescription>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Identificação */}
        <Card>
          <CardHeader>
            <CardTitle className="py-0.75">Identificação</CardTitle>
          </CardHeader>
          <CardContent className="mt-4 space-y-4">
            {/* nome · cnpj */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="name">Nome</FieldLabel>
                <Controller
                  control={control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <Input {...field} id="name" aria-invalid={fieldState.invalid || undefined} />
                  )}
                />
                {errors.name && <FieldError>{errors.name.message}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor="cnpj">CNPJ</FieldLabel>
                <Controller
                  control={control}
                  name="cnpj"
                  render={({ field, fieldState }) => (
                    <CnpjInput
                      id="cnpj"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                      name={field.name}
                      aria-invalid={fieldState.invalid || undefined}
                    />
                  )}
                />
                {errors.cnpj && <FieldError>{errors.cnpj.message}</FieldError>}
              </Field>
            </div>

            {/* endereço — mesma ordem/proporção do MePage (sem complemento) */}
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
              <Field className="sm:col-span-4">
                <FieldLabel htmlFor="addressStreet">Rua</FieldLabel>
                <Controller
                  control={control}
                  name="addressStreet"
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      id="addressStreet"
                      aria-invalid={fieldState.invalid || undefined}
                    />
                  )}
                />
                {errors.addressStreet && <FieldError>{errors.addressStreet.message}</FieldError>}
              </Field>

              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="addressNumber">Número</FieldLabel>
                <Controller
                  control={control}
                  name="addressNumber"
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      id="addressNumber"
                      aria-invalid={fieldState.invalid || undefined}
                    />
                  )}
                />
                {errors.addressNumber && <FieldError>{errors.addressNumber.message}</FieldError>}
              </Field>

              <Field className="sm:col-span-3">
                <FieldLabel htmlFor="addressDistrict">Bairro</FieldLabel>
                <Controller
                  control={control}
                  name="addressDistrict"
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      id="addressDistrict"
                      aria-invalid={fieldState.invalid || undefined}
                    />
                  )}
                />
                {errors.addressDistrict && (
                  <FieldError>{errors.addressDistrict.message}</FieldError>
                )}
              </Field>

              <Field className="sm:col-span-3">
                <FieldLabel htmlFor="addressCity">Cidade</FieldLabel>
                <Controller
                  control={control}
                  name="addressCity"
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      id="addressCity"
                      aria-invalid={fieldState.invalid || undefined}
                    />
                  )}
                />
                {errors.addressCity && <FieldError>{errors.addressCity.message}</FieldError>}
              </Field>

              <Field className="sm:col-span-1">
                <FieldLabel htmlFor="addressState">Estado</FieldLabel>
                <Controller
                  control={control}
                  name="addressState"
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      id="addressState"
                      maxLength={2}
                      placeholder="UF"
                      aria-invalid={fieldState.invalid || undefined}
                    />
                  )}
                />
                {errors.addressState && <FieldError>{errors.addressState.message}</FieldError>}
              </Field>

              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="postalCode">Código Postal</FieldLabel>
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
                {errors.postalCode && <FieldError>{errors.postalCode.message}</FieldError>}
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="py-0.75">Contato</CardTitle>
          </CardHeader>
          <CardContent className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
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
                {errors.phone && <FieldError>{errors.phone.message}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Controller
                  control={control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      id="email"
                      type="email"
                      aria-invalid={fieldState.invalid || undefined}
                    />
                  )}
                />
                {errors.email && <FieldError>{errors.email.message}</FieldError>}
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="websiteUrl">URL do Site</FieldLabel>
              <Controller
                control={control}
                name="websiteUrl"
                render={({ field, fieldState }) => (
                  <Input
                    {...field}
                    id="websiteUrl"
                    type="url"
                    aria-invalid={fieldState.invalid || undefined}
                  />
                )}
              />
              {errors.websiteUrl && <FieldError>{errors.websiteUrl.message}</FieldError>}
            </Field>
          </CardContent>
        </Card>

        {/* Diretoria Atual */}
        <Card>
          <CardHeader>
            <CardTitle className="py-0.75">Diretoria Atual</CardTitle>
          </CardHeader>
          <CardContent className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="currentPresidentName">Nome do Presidente</FieldLabel>
                <Controller
                  control={control}
                  name="currentPresidentName"
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      id="currentPresidentName"
                      aria-invalid={fieldState.invalid || undefined}
                    />
                  )}
                />
                {errors.currentPresidentName && (
                  <FieldError>{errors.currentPresidentName.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="currentPresidentTitle">Título do Presidente</FieldLabel>
                <Controller
                  control={control}
                  name="currentPresidentTitle"
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      id="currentPresidentTitle"
                      aria-invalid={fieldState.invalid || undefined}
                    />
                  )}
                />
                {errors.currentPresidentTitle && (
                  <FieldError>{errors.currentPresidentTitle.message}</FieldError>
                )}
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="currentSecretaryName">Nome do Secretário</FieldLabel>
                <Controller
                  control={control}
                  name="currentSecretaryName"
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      id="currentSecretaryName"
                      aria-invalid={fieldState.invalid || undefined}
                    />
                  )}
                />
                {errors.currentSecretaryName && (
                  <FieldError>{errors.currentSecretaryName.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="currentSecretaryTitle">Título do Secretário</FieldLabel>
                <Controller
                  control={control}
                  name="currentSecretaryTitle"
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      id="currentSecretaryTitle"
                      aria-invalid={fieldState.invalid || undefined}
                    />
                  )}
                />
                {errors.currentSecretaryTitle && (
                  <FieldError>{errors.currentSecretaryTitle.message}</FieldError>
                )}
              </Field>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="w-full sm:w-auto sm:min-w-32">
            {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>

      {/* Finance settings — separate endpoint/permission-shared surface, own action */}
      <FinanceSettingsCard />
    </PageContainer>
  );
}
