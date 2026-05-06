import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@/lib/zodResolver';
import { TransitionNotesSchema, type TransitionNotesFormValues } from '@/schemas/monthly-closing';
import { useClosingTransition } from './useMonthlyClosings';

type TransitionAction = 'submit' | 'approve' | 'reject' | 'close';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  closingId: number;
  action: TransitionAction;
  onSuccess?: () => void;
}

const ACTION_CONFIG: Record<
  TransitionAction,
  { title: string; description: string; notesLabel?: string; confirmLabel: string }
> = {
  submit: {
    title: 'Submeter para Revisão',
    description: 'O fechamento será enviado para revisão do contador.',
    notesLabel: 'Observações do Tesoureiro (opcional)',
    confirmLabel: 'Submeter'
  },
  approve: {
    title: 'Aprovar Fechamento',
    description: 'O fechamento será aprovado e ficará pronto para ser fechado.',
    notesLabel: 'Observações do Contador (opcional)',
    confirmLabel: 'Aprovar'
  },
  reject: {
    title: 'Rejeitar Fechamento',
    description: 'O fechamento voltará ao status "aberto" para correções.',
    notesLabel: 'Motivo da Rejeição (opcional)',
    confirmLabel: 'Rejeitar'
  },
  close: {
    title: 'Fechar Período',
    description: 'O período será permanentemente fechado. Esta ação não pode ser desfeita.',
    confirmLabel: 'Fechar Período'
  }
};

export function ClosingTransitionDialog({
  open,
  onOpenChange,
  closingId,
  action,
  onSuccess
}: Props) {
  const config = ACTION_CONFIG[action];
  const transition = useClosingTransition();

  const form = useForm<TransitionNotesFormValues>({
    resolver: zodResolver(TransitionNotesSchema),
    defaultValues: { notes: '' }
  });

  const handleSubmit = (values: TransitionNotesFormValues) => {
    const notes = values.notes || undefined;
    transition.mutate(
      { id: closingId, action, notes },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
          onSuccess?.();
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" noValidate>
          {config.notesLabel && (
            <FieldGroup>
              <Controller
                name="notes"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>{config.notesLabel}</FieldLabel>
                    <Textarea {...field} rows={3} />
                  </Field>
                )}
              />
            </FieldGroup>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={transition.isPending}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={transition.isPending}
              variant={action === 'reject' ? 'destructive' : 'default'}>
              {transition.isPending ? 'Processando...' : config.confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
