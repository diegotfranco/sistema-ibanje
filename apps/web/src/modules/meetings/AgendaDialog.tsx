import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  AgendaFormSchema,
  type AgendaFormValues,
  type AgendaItemResponse
} from '@/schemas/meeting';
import { useSetAgenda } from './useMeetings';

interface AgendaDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  meetingId: number;
  currentItems: AgendaItemResponse[];
}

const EMPTY_ITEM = { title: '', description: '' };

function initialValues(items: AgendaItemResponse[]): AgendaFormValues {
  if (items.length === 0) return { items: [{ ...EMPTY_ITEM }] };
  return {
    items: items.map((i) => ({ title: i.title, description: i.description ?? '' }))
  };
}

interface SortableRowProps {
  id: string;
  index: number;
  control: ReturnType<typeof useForm<AgendaFormValues>>['control'];
  register: ReturnType<typeof useForm<AgendaFormValues>>['register'];
  onRemove: () => void;
  canRemove: boolean;
  errors: ReturnType<typeof useForm<AgendaFormValues>>['formState']['errors'];
}

function SortableRow({ id, index, register, onRemove, canRemove, errors }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };
  const itemErrors = errors.items?.[index];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 rounded border border-border bg-card p-3">
      <button
        type="button"
        className="mt-2 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label="Arrastar para reordenar"
        {...attributes}
        {...listeners}>
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 space-y-2">
        <div>
          <Input placeholder="Título do item" {...register(`items.${index}.title`)} />
          {itemErrors?.title && (
            <p className="mt-1 text-xs text-destructive">{itemErrors.title.message}</p>
          )}
        </div>
        <div>
          <Textarea
            placeholder="Descrição (opcional)"
            rows={2}
            {...register(`items.${index}.description`)}
          />
          {itemErrors?.description && (
            <p className="mt-1 text-xs text-destructive">{itemErrors.description.message}</p>
          )}
        </div>
      </div>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label="Remover item"
        disabled={!canRemove}
        onClick={onRemove}
        className="text-destructive hover:text-destructive/80 disabled:opacity-30">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function AgendaDialog({
  open,
  onOpenChange,
  meetingId,
  currentItems
}: AgendaDialogProps) {
  const setAgenda = useSetAgenda();

  const form = useForm<AgendaFormValues>({
    resolver: zodResolver(AgendaFormSchema),
    defaultValues: initialValues(currentItems)
  });

  const { control, register, handleSubmit, reset, formState } = form;
  const { fields, append, remove, move } = useFieldArray({ control, name: 'items' });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (open) reset(initialValues(currentItems));
  }, [open, currentItems, reset]);

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) move(oldIndex, newIndex);
  }

  function onSubmit(values: AgendaFormValues) {
    const items = values.items.map((i) => ({
      title: i.title.trim(),
      ...(i.description && i.description.trim() ? { description: i.description.trim() } : {})
    }));
    setAgenda.mutate({ id: meetingId, items }, { onSuccess: () => onOpenChange(false) });
  }

  const rootError = formState.errors.items?.message;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Definir Pauta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">
              Arraste pelo ícone para reordenar
            </Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => append({ ...EMPTY_ITEM })}
              disabled={fields.length >= 50}>
              <Plus className="h-4 w-4" />
              Adicionar item
            </Button>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <SortableRow
                    key={field.id}
                    id={field.id}
                    index={index}
                    control={control}
                    register={register}
                    onRemove={() => remove(index)}
                    canRemove={fields.length > 1}
                    errors={formState.errors}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {rootError && <p className="text-xs text-destructive">{rootError}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={setAgenda.isPending}>
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
