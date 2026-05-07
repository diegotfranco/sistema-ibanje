import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { MinuteFormSchema, type MinuteFormValues } from '@/schemas/minute';
import { useBoardMeetings } from '@/modules/pautas/useBoardMeetings';

const EMPTY: MinuteFormValues = { boardMeetingId: 0, minuteNumber: '', content: '' };

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
  const meetings = useBoardMeetings();
  const availableMeetings = (meetings.data?.data ?? []).filter((m) => !m.hasMinutes);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<MinuteFormValues>({
    resolver: zodResolver(MinuteFormSchema),
    defaultValues: EMPTY
  });

  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Ata</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Reunião *</Label>
            <Controller
              control={control}
              name="boardMeetingId"
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : ''}
                  onValueChange={(v) => field.onChange(parseInt(v, 10))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a reunião" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMeetings.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {formatDate(m.meetingDate)} — {m.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.boardMeetingId && <p className="text-xs text-red-500">{errors.boardMeetingId.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="minuteNumber">Número da Ata *</Label>
            <Input id="minuteNumber" placeholder="Ata 001/2025" {...register('minuteNumber')} />
            {errors.minuteNumber && <p className="text-xs text-red-500">{errors.minuteNumber.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Conteúdo *</Label>
            <Controller
              control={control}
              name="content"
              render={({ field }) => (
                <RichTextEditor value={field.value} onChange={field.onChange} />
              )}
            />
            {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
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
