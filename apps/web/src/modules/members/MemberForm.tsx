import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import DateInput from '@/components/DateInput';
import { MemberFormSchema, type MemberFormValues } from '@/schemas/member';

interface MemberFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultValues?: MemberFormValues;
  onSubmit: (values: MemberFormValues) => void;
  isPending: boolean;
}

const EMPTY: MemberFormValues = {
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
  postalCode: null
};

export default function MemberForm({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  isPending
}: MemberFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<MemberFormValues>({
    resolver: zodResolver(MemberFormSchema),
    defaultValues: defaultValues ?? EMPTY
  });

  useEffect(() => {
    if (open) reset(defaultValues ?? EMPTY);
  }, [open, defaultValues, reset]);

  function prepare(values: MemberFormValues): MemberFormValues {
    return {
      ...values,
      email: values.email?.trim() || null,
      phone: values.phone?.trim() || null,
      postalCode: values.postalCode?.trim() || null,
      addressStreet: values.addressStreet?.trim() || null,
      addressComplement: values.addressComplement?.trim() || null,
      addressDistrict: values.addressDistrict?.trim() || null,
      city: values.city?.trim() || null,
      state: values.state?.trim() || null
    };
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{defaultValues ? 'Editar Membro' : 'Novo Membro'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => onSubmit(prepare(v)))} className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Dados Pessoais</p>
          <Separator />

          <div className="space-y-1">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="birthDate">Data de Nascimento</Label>
              <DateInput id="birthDate" {...register('birthDate')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" {...register('phone')} maxLength={16} />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

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
                <p className="text-xs text-red-500">{errors.postalCode.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="state">Estado (UF)</Label>
              <Input id="state" {...register('state')} maxLength={2} placeholder="SP" />
              {errors.state && <p className="text-xs text-red-500">{errors.state.message}</p>}
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
                <p className="text-xs text-red-500">{errors.addressNumber.message}</p>
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
