import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { MinuteFormSchema, type MinuteFormValues } from '@/schemas/minute';
import { useMeetings } from '@/modules/meetings/useMeetings';
import { useSuggestedMinuteNumber } from './useMinutes';

const EMPTY: MinuteFormValues = {
  meetingId: 0,
  minuteNumber: '',
  presidingPastorName: '',
  secretaryName: '',
  openingTime: '',
  closingTime: ''
};

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

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors }
  } = useForm<MinuteFormValues>({
    resolver: zodResolver(MinuteFormSchema),
    defaultValues: EMPTY
  });

  useEffect(() => {
    if (open) {
      reset({ ...EMPTY, minuteNumber: suggested.data?.value ?? '' });
    }
  }, [open, suggested.data?.value, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Ata</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((v) => {
            const cleaned = Object.fromEntries(
              Object.entries(v).map(([k, val]) => [k, val === '' ? undefined : val])
            ) as MinuteFormValues;
            onSubmit(cleaned);
          })}
          className="space-y-4">
          <div className="space-y-1">
            <Label>Reunião *</Label>
            <Controller
              control={control}
              name="meetingId"
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : ''}
                  onValueChange={(v) => field.onChange(Number.parseInt(v, 10))}>
                  <SelectTrigger>
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
            {errors.meetingId && <p className="text-xs text-red-500">{errors.meetingId.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="minuteNumber">Número da Ata *</Label>
            <Input id="minuteNumber" placeholder="Ata 001/2025" {...register('minuteNumber')} />
            {errors.minuteNumber && (
              <p className="text-xs text-red-500">{errors.minuteNumber.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="presidingPastorName">Pastor Presidente</Label>
              <Input
                id="presidingPastorName"
                placeholder="Nome"
                {...register('presidingPastorName')}
              />
              {errors.presidingPastorName && (
                <p className="text-xs text-red-500">{errors.presidingPastorName.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="secretaryName">Secretário</Label>
              <Input id="secretaryName" placeholder="Nome" {...register('secretaryName')} />
              {errors.secretaryName && (
                <p className="text-xs text-red-500">{errors.secretaryName.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="openingTime">Hora de Abertura</Label>
              <Input type="time" id="openingTime" {...register('openingTime')} />
              {errors.openingTime && (
                <p className="text-xs text-red-500">{errors.openingTime.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="closingTime">Hora de Encerramento</Label>
              <Input type="time" id="closingTime" {...register('closingTime')} />
              {errors.closingTime && (
                <p className="text-xs text-red-500">{errors.closingTime.message}</p>
              )}
            </div>
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
