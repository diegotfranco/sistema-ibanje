import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { autofillSafeSubmit } from '@/lib/forms';
import { Button } from '@/components/Button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/Dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import DateInput from '@/components/DateInput';
import MonthInput from '@/components/MonthInput';
import { PhoneInput, CepInput } from '@/components/MaskedInput';
import { AdmissionMode } from '@sistema-ibanje/shared';
import { AttenderFormSchema, type AttenderFormValues } from './schema';

interface AttenderFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultValues?: AttenderFormValues;
  onSubmit: (values: AttenderFormValues) => void;
  isPending: boolean;
  formRef?: React.Ref<ReturnType<typeof useForm<AttenderFormValues>> | null>;
}

const EMPTY: AttenderFormValues = {
  name: '',
  birthDate: null,
  phone: null,
  email: null,
  addressStreet: null,
  addressNumber: null,
  addressComplement: null,
  addressDistrict: null,
  state: null,
  city: null,
  postalCode: null,
  isMember: false,
  memberSince: null,
  baptismDate: null,
  congregatingSince: null,
  admissionMode: null
};

export default function AttenderForm({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  isPending,
  formRef
}: AttenderFormProps) {
  const form = useForm<AttenderFormValues>({
    resolver: zodResolver(AttenderFormSchema),
    defaultValues: defaultValues ?? EMPTY
  });

  const {
    register,
    reset,
    control,
    formState: { errors }
  } = form;

  const isMember = useWatch({ control, name: 'isMember' }) ?? false;
  // Membership is set at creation (for entering already-existing members) but on an existing
  // attender it changes only via the dedicated admission action / status exits — so the whole
  // "Vínculo" block is hidden when editing.
  const isEditing = !!defaultValues;

  useEffect(() => {
    if (formRef && 'current' in formRef) {
      formRef.current = form;
    }

    if (open) reset(defaultValues ?? EMPTY);
  }, [open, defaultValues, reset, formRef, form]);

  function prepare(values: AttenderFormValues): AttenderFormValues {
    return {
      ...values,
      email: values.email?.trim() || null,
      phone: values.phone?.trim() || null,
      postalCode: values.postalCode?.trim() || null,
      addressStreet: values.addressStreet?.trim() || null,
      addressComplement: values.addressComplement?.trim() || null,
      addressDistrict: values.addressDistrict?.trim() || null,
      city: values.city?.trim() || null,
      state: values.state?.trim() || null,
      baptismDate: values.baptismDate || null,
      congregatingSince: values.congregatingSince || null,
      memberSince: values.isMember ? values.memberSince || null : null,
      admissionMode: values.isMember ? (values.admissionMode ?? null) : null
    };
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{defaultValues ? 'Editar Congregado' : 'Novo Congregado'}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={autofillSafeSubmit(form, (v) => onSubmit(prepare(v)))}
          className="space-y-4">
          <p className="text-sm font-medium text-primary-soft">Dados Pessoais</p>
          <Separator />

          <Field data-invalid={!!errors.name || undefined}>
            <FieldLabel htmlFor="name">Nome *</FieldLabel>
            <Input id="name" {...register('name')} aria-invalid={!!errors.name || undefined} />
            {errors.name && <FieldError errors={[errors.name]} />}
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="birthDate">Data de Nascimento</FieldLabel>
              <Controller
                control={control}
                name="birthDate"
                render={({ field }) => (
                  <DateInput
                    id="birthDate"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    name={field.name}
                  />
                )}
              />
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
          </div>

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

          <Field data-invalid={!!errors.congregatingSince || undefined}>
            <FieldLabel htmlFor="congregatingSince">Congregando desde</FieldLabel>
            <Controller
              control={control}
              name="congregatingSince"
              render={({ field, fieldState }) => (
                <MonthInput
                  id="congregatingSince"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  name={field.name}
                  aria-invalid={fieldState.invalid || undefined}
                />
              )}
            />
            {errors.congregatingSince && <FieldError errors={[errors.congregatingSince]} />}
          </Field>

          {!isEditing && (
            <>
              <p className="pt-2 text-sm font-medium text-primary-soft">Vínculo</p>
              <Separator />

              <div className="flex items-center gap-2">
                <Controller
                  name="isMember"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="isMember"
                      checked={field.value ?? false}
                      onCheckedChange={(v) => field.onChange(v === true)}
                    />
                  )}
                />
                <Label htmlFor="isMember" className="cursor-pointer">
                  É membro da igreja
                </Label>
              </div>

              <Field>
                <FieldLabel htmlFor="baptismDate">Data de batismo</FieldLabel>
                <Controller
                  control={control}
                  name="baptismDate"
                  render={({ field }) => (
                    <DateInput
                      id="baptismDate"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  )}
                />
              </Field>

              {isMember && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field data-invalid={!!errors.memberSince || undefined}>
                    <FieldLabel htmlFor="memberSince">Membro desde</FieldLabel>
                    <Controller
                      control={control}
                      name="memberSince"
                      render={({ field, fieldState }) => (
                        <MonthInput
                          id="memberSince"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value)}
                          onBlur={field.onBlur}
                          name={field.name}
                          aria-invalid={fieldState.invalid || undefined}
                        />
                      )}
                    />
                    {errors.memberSince && <FieldError errors={[errors.memberSince]} />}
                  </Field>
                  <Field data-invalid={!!errors.admissionMode || undefined}>
                    <FieldLabel htmlFor="admissionMode">Modo de Admissão</FieldLabel>
                    <Controller
                      name="admissionMode"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Select
                          value={field.value ?? ''}
                          onValueChange={(v) =>
                            field.onChange(
                              v === '' ? null : (v as AttenderFormValues['admissionMode'])
                            )
                          }>
                          <SelectTrigger
                            id="admissionMode"
                            className="w-full"
                            aria-invalid={fieldState.invalid || undefined}>
                            <SelectValue placeholder="Selecionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={AdmissionMode.Acclamation}>Aclamação</SelectItem>
                            <SelectItem value={AdmissionMode.Baptism}>Batismo</SelectItem>
                            <SelectItem value={AdmissionMode.TransferLetter}>
                              Carta de Transferência
                            </SelectItem>
                            <SelectItem value={AdmissionMode.FaithProfession}>
                              Profissão de Fé
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.admissionMode && <FieldError errors={[errors.admissionMode]} />}
                  </Field>
                </div>
              )}
            </>
          )}

          <p className="pt-2 text-sm font-medium text-primary-soft">Endereço</p>
          <Separator />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
            <Field className="sm:col-span-4">
              <FieldLabel htmlFor="addressStreet">Rua</FieldLabel>
              <Input id="addressStreet" {...register('addressStreet')} />
            </Field>

            <Field className="sm:col-span-2" data-invalid={!!errors.addressNumber || undefined}>
              <FieldLabel htmlFor="addressNumber">Número</FieldLabel>
              <Input
                id="addressNumber"
                maxLength={16}
                {...register('addressNumber', {
                  setValueAs: (v) => (v === '' || v === null ? null : String(v))
                })}
                aria-invalid={!!errors.addressNumber || undefined}
              />
              {errors.addressNumber && <FieldError errors={[errors.addressNumber]} />}
            </Field>

            <Field className="sm:col-span-3">
              <FieldLabel htmlFor="addressComplement">Complemento</FieldLabel>
              <Input id="addressComplement" {...register('addressComplement')} />
            </Field>

            <Field className="sm:col-span-3">
              <FieldLabel htmlFor="addressDistrict">Bairro</FieldLabel>
              <Input id="addressDistrict" {...register('addressDistrict')} />
            </Field>

            <Field className="sm:col-span-1" data-invalid={!!errors.state || undefined}>
              <FieldLabel htmlFor="state">Estado</FieldLabel>
              <Input
                id="state"
                {...register('state')}
                maxLength={2}
                placeholder="UF"
                aria-invalid={!!errors.state || undefined}
              />
              {errors.state && <FieldError errors={[errors.state]} />}
            </Field>

            <Field className="sm:col-span-3">
              <FieldLabel htmlFor="city">Cidade</FieldLabel>
              <Input id="city" {...register('city')} />
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
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
