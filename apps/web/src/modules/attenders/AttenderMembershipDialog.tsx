import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { Button } from '@/components/Button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/Dialog';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import DateInput from '@/components/DateInput';
import MonthInput from '@/components/MonthInput';
import { AdmissionMode } from '@sistema-ibanje/shared';
import { AdmitMemberSchema, type AdmitMemberValues } from './schema';
import type { AttenderResponse } from './schema';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  attender: AttenderResponse | null;
  onSubmit: (values: AdmitMemberValues) => void;
  isPending: boolean;
  formRef?: React.Ref<ReturnType<typeof useForm<AdmitMemberValues>> | null>;
}

// Admission of a congregado as a church member. Mirrors the status dialog's "guarded command"
// shape — it records how (admissionMode) and when (memberSince) membership began.
export default function AttenderMembershipDialog({
  open,
  onOpenChange,
  attender,
  onSubmit,
  isPending,
  formRef
}: Props) {
  const form = useForm<AdmitMemberValues>({
    resolver: zodResolver(AdmitMemberSchema),
    defaultValues: { admissionMode: AdmissionMode.Baptism, memberSince: '', baptismDate: null }
  });

  const {
    handleSubmit,
    reset,
    control,
    formState: { errors }
  } = form;

  useEffect(() => {
    if (formRef && 'current' in formRef) formRef.current = form;
    if (open) {
      reset({
        admissionMode: AdmissionMode.Baptism,
        memberSince: attender?.congregatingSince ?? '',
        baptismDate: attender?.baptismDate ?? null
      });
    }
  }, [open, attender, reset, form, formRef]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Admitir como membro — {attender?.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field data-invalid={!!errors.admissionMode || undefined}>
            <FieldLabel htmlFor="admissionMode">Modo de admissão *</FieldLabel>
            <Controller
              control={control}
              name="admissionMode"
              render={({ field, fieldState }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => field.onChange(v as AdmitMemberValues['admissionMode'])}>
                  <SelectTrigger
                    id="admissionMode"
                    className="w-full"
                    aria-invalid={fieldState.invalid || undefined}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AdmissionMode.Acclamation}>Aclamação</SelectItem>
                    <SelectItem value={AdmissionMode.Baptism}>Batismo</SelectItem>
                    <SelectItem value={AdmissionMode.TransferLetter}>
                      Carta de Transferência
                    </SelectItem>
                    <SelectItem value={AdmissionMode.FaithProfession}>Profissão de Fé</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.admissionMode && <FieldError errors={[errors.admissionMode]} />}
          </Field>

          <Field data-invalid={!!errors.memberSince || undefined}>
            <FieldLabel htmlFor="memberSince">Membro desde *</FieldLabel>
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Admitir'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
