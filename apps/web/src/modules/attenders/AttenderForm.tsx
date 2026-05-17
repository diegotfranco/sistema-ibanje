import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import DateInput from '@/components/DateInput';
import { AdmissionMode } from '@sistema-ibanje/shared';
import { AttenderFormSchema, type AttenderFormValues } from '@/schemas/attender';

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
  userId: null,
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
  congregatingSinceYear: null,
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
    handleSubmit,
    reset,
    control,
    formState: { errors }
  } = form;

  const isMember = useWatch({ control, name: 'isMember' }) ?? false;

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
      memberSince: values.isMember ? values.memberSince || null : null,
      admissionMode: values.isMember ? (values.admissionMode ?? null) : null
    };
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{defaultValues ? 'Editar Congregado' : 'Novo Congregado'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => onSubmit(prepare(v)))} className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Dados Pessoais</p>
          <Separator />

          <div className="space-y-1">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="birthDate">Data de Nascimento</Label>
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
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" {...register('phone')} maxLength={16} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="congregatingSinceYear">Congregando desde (ano)</Label>
            <Input
              id="congregatingSinceYear"
              type="number"
              min={1900}
              max={2100}
              placeholder="2010"
              {...register('congregatingSinceYear', {
                setValueAs: (v) => (v === '' || v === null ? null : Number(v))
              })}
            />
            {errors.congregatingSinceYear && (
              <p className="text-xs text-destructive">{errors.congregatingSinceYear.message}</p>
            )}
          </div>

          <p className="pt-2 text-sm font-medium text-muted-foreground">Membresia</p>
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

          {isMember && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="memberSince">Membro desde</Label>
                <Controller
                  control={control}
                  name="memberSince"
                  render={({ field }) => (
                    <DateInput
                      id="memberSince"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="admissionMode">Modo de Admissão</Label>
                <Controller
                  name="admissionMode"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ''}
                      onValueChange={(v) =>
                        field.onChange(v === '' ? null : (v as AttenderFormValues['admissionMode']))
                      }>
                      <SelectTrigger id="admissionMode" className="w-full">
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
                {errors.admissionMode && (
                  <p className="text-xs text-destructive">{errors.admissionMode.message}</p>
                )}
              </div>
            </div>
          )}

          <p className="pt-2 text-sm font-medium text-muted-foreground">Endereço</p>
          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="postalCode">CEP</Label>
              <Input
                id="postalCode"
                {...register('postalCode')}
                maxLength={8}
                placeholder="00000000"
              />
              {errors.postalCode && (
                <p className="text-xs text-destructive">{errors.postalCode.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="state">Estado (UF)</Label>
              <Input id="state" {...register('state')} maxLength={2} placeholder="SP" />
              {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="city">Cidade</Label>
            <Input id="city" {...register('city')} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="addressStreet">Rua</Label>
            <Input id="addressStreet" {...register('addressStreet')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="addressNumber">Número</Label>
              <Input
                id="addressNumber"
                type="number"
                min={1}
                {...register('addressNumber', {
                  setValueAs: (v) => (v === '' || v === null ? null : Number(v))
                })}
              />
              {errors.addressNumber && (
                <p className="text-xs text-destructive">{errors.addressNumber.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="addressComplement">Complemento</Label>
              <Input id="addressComplement" {...register('addressComplement')} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="addressDistrict">Bairro</Label>
            <Input id="addressDistrict" {...register('addressDistrict')} />
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
