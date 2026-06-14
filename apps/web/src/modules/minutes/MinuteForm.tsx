import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import { MinuteFormSchema, type MinuteFormValues } from './schema';
import { useMeetings } from '@/modules/meetings/useMeetings';
import { useSuggestedMinuteNumber } from './useMinutes';

function formatDate(d: string) {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

interface MinuteFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (values: MinuteFormValues) => void;
  isPending: boolean;
}

export default function MinuteForm({ open, onOpenChange, onSubmit, isPending }: MinuteFormProps) {
  const meetings = useMeetings();
  const allMeetings = meetings.data?.data ?? [];
  const suggested = useSuggestedMinuteNumber(open);

  const form = useForm<MinuteFormValues>({
    resolver: zodResolver(MinuteFormSchema),
    defaultValues: {
      meetingId: 0,
      minuteNumber: '',
      presidingPastorName: '',
      secretaryName: '',
      openingTime: '',
      closingTime: ''
    }
  });
  const {
    register,
    reset,
    control,
    formState: { errors }
  } = form;

  useEffect(() => {
    if (open) {
      reset({ minuteNumber: suggested.data?.value ?? '' });
    }
  }, [open, suggested.data?.value, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Ata</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={autofillSafeSubmit(form, (v) => {
            const cleaned = Object.fromEntries(
              Object.entries(v).map(([k, val]) => [k, val === '' ? undefined : val])
            ) as MinuteFormValues;
            onSubmit(cleaned);
          })}
          className="space-y-4">
          <Field data-invalid={!!errors.meetingId || undefined}>
            <FieldLabel>Reunião *</FieldLabel>
            <Controller
              control={control}
              name="meetingId"
              render={({ field, fieldState }) => (
                <Select
                  value={field.value ? String(field.value) : undefined}
                  onValueChange={(v) => field.onChange(Number.parseInt(v))}>
                  <SelectTrigger aria-invalid={fieldState.invalid || undefined}>
                    <SelectValue placeholder="Selecione a reunião" />
                  </SelectTrigger>
                  <SelectContent>
                    {allMeetings.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)} disabled={m.hasMinutes}>
                        {formatDate(m.meetingDate)} — {m.type}
                        {m.hasMinutes && ' (já possui ata)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.meetingId && <FieldError errors={[errors.meetingId]} />}
          </Field>

          <Field data-invalid={!!errors.minuteNumber || undefined}>
            <FieldLabel htmlFor="minuteNumber">Número da Ata *</FieldLabel>
            <Input
              id="minuteNumber"
              {...register('minuteNumber')}
              aria-invalid={!!errors.minuteNumber || undefined}
            />
            {errors.minuteNumber && <FieldError errors={[errors.minuteNumber]} />}
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field data-invalid={!!errors.presidingPastorName || undefined}>
              <FieldLabel htmlFor="presidingPastorName">Pastor Presidente</FieldLabel>
              <Input
                id="presidingPastorName"
                {...register('presidingPastorName')}
                aria-invalid={!!errors.presidingPastorName || undefined}
              />
              {errors.presidingPastorName && <FieldError errors={[errors.presidingPastorName]} />}
            </Field>

            <Field data-invalid={!!errors.secretaryName || undefined}>
              <FieldLabel htmlFor="secretaryName">Secretário</FieldLabel>
              <Input
                id="secretaryName"
                {...register('secretaryName')}
                aria-invalid={!!errors.secretaryName || undefined}
              />
              {errors.secretaryName && <FieldError errors={[errors.secretaryName]} />}
            </Field>

            <Field data-invalid={!!errors.openingTime || undefined}>
              <FieldLabel htmlFor="openingTime">Hora de Abertura</FieldLabel>
              <Input
                type="time"
                id="openingTime"
                {...register('openingTime')}
                aria-invalid={!!errors.openingTime || undefined}
              />
              {errors.openingTime && <FieldError errors={[errors.openingTime]} />}
            </Field>

            <Field data-invalid={!!errors.closingTime || undefined}>
              <FieldLabel htmlFor="closingTime">Hora de Encerramento</FieldLabel>
              <Input
                type="time"
                id="closingTime"
                {...register('closingTime')}
                aria-invalid={!!errors.closingTime || undefined}
              />
              {errors.closingTime && <FieldError errors={[errors.closingTime]} />}
            </Field>
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            O conteúdo da ata será gerado automaticamente a partir do modelo padrão para o tipo de
            reunião. Você poderá editá-lo após criar a ata.
          </p>

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
