import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  RichTextEditor as RichTextEditorComponent,
  EMPTY_TIPTAP_DOC,
  type TipTapDoc
} from '@/components/ui/rich-text-editor';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentContent: TipTapDoc | null;
  onSubmit: (content: TipTapDoc) => void;
  isPending: boolean;
}

export default function EditPendingDialog({
  open,
  onOpenChange,
  currentContent,
  onSubmit,
  isPending
}: Props) {
  const { handleSubmit, reset, control } = useForm<{ content: TipTapDoc }>({
    defaultValues: { content: currentContent ?? EMPTY_TIPTAP_DOC }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) reset({ content: currentContent ?? EMPTY_TIPTAP_DOC });
        onOpenChange(v);
      }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Rascunho</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((v: { content: TipTapDoc }) => onSubmit(v.content))}
          className="space-y-4">
          <div className="space-y-1">
            <Label>Conteúdo</Label>
            <Controller
              control={control}
              name="content"
              render={({ field }) => (
                <RichTextEditorComponent
                  value={field.value as TipTapDoc}
                  onChange={field.onChange}
                />
              )}
            />
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
