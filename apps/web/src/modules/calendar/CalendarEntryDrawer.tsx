import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/Button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import DateInput from '@/components/DateInput';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { zodResolver } from '@/lib/zodResolver';
import { CalendarEntryFormSchema, type CalendarEntryFormValues } from './schema';

export type CalendarDraft = {
  id: number | null;
  title?: string;
  date: string;
  notes?: string | null;
};

interface Props {
  draft: CalendarDraft | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: CalendarEntryFormValues) => void;
  onDelete: (id: number) => void;
}

export function CalendarEntryDrawer({ draft, isPending, onClose, onSubmit, onDelete }: Props) {
  const isEdit = draft?.id != null;
  const [confirmDelete, setConfirmDelete] = useState(false);

  // `values` makes react-hook-form reactively re-sync when the draft changes — no effect needed.
  const form = useForm<CalendarEntryFormValues>({
    resolver: zodResolver(CalendarEntryFormSchema),
    values: { title: draft?.title ?? '', date: draft?.date ?? '', notes: draft?.notes ?? '' }
  });

  // Reset the delete-confirmation when switching drafts (setState during render with a guard).
  const draftKey = draft ? `${draft.id ?? 'new'}:${draft.date}` : null;
  const [seenKey, setSeenKey] = useState(draftKey);
  if (draftKey !== seenKey) {
    setSeenKey(draftKey);
    if (confirmDelete) setConfirmDelete(false);
  }

  const handleSubmit = (values: CalendarEntryFormValues) => {
    onSubmit({ ...values, notes: values.notes || undefined });
  };

  return (
    <Sheet open={draft != null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar data' : 'Nova data'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Atualize os detalhes desta data do calendário.'
              : 'Adicione uma data, feriado ou lembrete ao calendário.'}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
          noValidate>
          <FieldGroup>
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Título</FieldLabel>
                  <Input {...field} aria-invalid={fieldState.invalid} maxLength={128} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="date"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Data</FieldLabel>
                  <DateInput
                    {...field}
                    value={field.value || ''}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="notes"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Observações (opcional)</FieldLabel>
                  <Textarea {...field} aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>

          <SheetFooter className="mt-auto flex-row justify-end gap-2 px-0">
            {isEdit && (
              <Button
                type="button"
                variant="outline"
                className="mr-auto text-red-600 hover:text-red-700"
                onClick={() => setConfirmDelete(true)}
                disabled={isPending}>
                <Trash2 size={16} />
                Remover
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>

      <ConfirmDeleteDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        description="Tem certeza que deseja remover esta data do calendário?"
        isPending={isPending}
        onConfirm={() => {
          if (draft?.id != null) onDelete(draft.id);
          setConfirmDelete(false);
        }}
      />
    </Sheet>
  );
}
