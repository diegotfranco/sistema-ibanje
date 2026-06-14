import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
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
import { RichTextEditor, EMPTY_TIPTAP_DOC, type TipTapDoc } from '@/components/RichTextEditor';
import { useEditApprovedMinute } from './useMinutes';
import { EditApprovedMinuteSchema, type EditApprovedMinuteValues } from './schema';

interface MinuteEditApprovedFormProps {
  minuteId: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentContent: TipTapDoc | null;
  onSuccess?: () => void;
}

export default function MinuteEditApprovedForm({
  minuteId,
  open,
  onOpenChange,
  currentContent,
  onSuccess
}: MinuteEditApprovedFormProps) {
  const editApproved = useEditApprovedMinute(minuteId);
  const form = useForm<EditApprovedMinuteValues>({
    resolver: zodResolver(EditApprovedMinuteSchema),
    defaultValues: { content: EMPTY_TIPTAP_DOC, reasonForChange: '' }
  });

  const handleOpenChange = (v: boolean) => {
    if (v && currentContent) {
      form.reset({
        content: (currentContent as TipTapDoc) ?? EMPTY_TIPTAP_DOC,
        reasonForChange: ''
      });
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Versão</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((v) =>
            editApproved.mutate(v, {
              onSuccess: () => {
                onOpenChange(false);
                onSuccess?.();
              }
            })
          )}
          className="space-y-4">
          <Field data-invalid={!!form.formState.errors.content || undefined}>
            <FieldLabel>Conteúdo *</FieldLabel>
            <Controller
              control={form.control}
              name="content"
              render={({ field }) => (
                <RichTextEditor value={field.value as TipTapDoc} onChange={field.onChange} />
              )}
            />
            {form.formState.errors.content && (
              <FieldError errors={[form.formState.errors.content]} />
            )}
          </Field>
          <Field data-invalid={!!form.formState.errors.reasonForChange || undefined}>
            <FieldLabel htmlFor="ea-reason">Motivo da alteração *</FieldLabel>
            <Input
              id="ea-reason"
              {...form.register('reasonForChange')}
              aria-invalid={!!form.formState.errors.reasonForChange || undefined}
            />
            {form.formState.errors.reasonForChange && (
              <FieldError errors={[form.formState.errors.reasonForChange]} />
            )}
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={editApproved.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={editApproved.isPending}>
              {editApproved.isPending ? 'Salvando...' : 'Salvar Nova Versão'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
