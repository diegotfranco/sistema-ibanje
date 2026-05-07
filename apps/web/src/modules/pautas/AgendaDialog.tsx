import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AgendaFormSchema, type AgendaFormValues } from '@/schemas/board-meeting';
import { useSetAgenda } from './useBoardMeetings';

interface AgendaDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  meetingId: number;
  currentItems: string[] | null;
}

export default function AgendaDialog({
  open,
  onOpenChange,
  meetingId,
  currentItems
}: AgendaDialogProps) {
  const setAgenda = useSetAgenda();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AgendaFormValues>({
    resolver: zodResolver(AgendaFormSchema),
    defaultValues: { agendaText: currentItems?.join('\n') ?? '' }
  });

  useEffect(() => {
    if (open) reset({ agendaText: currentItems?.join('\n') ?? '' });
  }, [open, currentItems, reset]);

  function onSubmit(values: AgendaFormValues) {
    const items = values.agendaText.split('\n').map((s) => s.trim()).filter(Boolean);
    setAgenda.mutate({ id: meetingId, items }, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Definir Pauta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="agendaText">Itens da pauta (um por linha)</Label>
            <Textarea
              id="agendaText"
              rows={8}
              placeholder="Oração de abertura&#10;Leitura da ata anterior&#10;..."
              {...register('agendaText')}
            />
            {errors.agendaText && <p className="text-xs text-red-500">{errors.agendaText.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={setAgenda.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={setAgenda.isPending}>
              {setAgenda.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
