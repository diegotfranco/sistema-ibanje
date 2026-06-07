import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/Button';
import { DialogFooter } from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@/lib/zodResolver';
import { EventFormSchema, type EventFormValues, type EventResponse } from './schema';

interface Props {
  initialValues?: EventResponse;
  isPending: boolean;
  onSubmit: (values: EventFormValues) => void;
  onCancel: () => void;
}

// "datetime-local" inputs use the local-time format `YYYY-MM-DDTHH:mm` (no zone).
// Trim seconds and zone offset from ISO strings round-tripped from the API.
function toLocalInput(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(local: string): string {
  return new Date(local).toISOString();
}

export function EventForm({ initialValues, isPending, onSubmit, onCancel }: Props) {
  const form = useForm<EventFormValues>({
    resolver: zodResolver(EventFormSchema),
    defaultValues: {
      title: initialValues?.title ?? '',
      description: initialValues?.description ?? '',
      location: initialValues?.location ?? '',
      startTime: toLocalInput(initialValues?.startTime),
      endTime: toLocalInput(initialValues?.endTime)
    }
  });

  const handleSubmit = (values: EventFormValues) => {
    onSubmit({
      ...values,
      description: values.description || undefined,
      location: values.location || undefined,
      startTime: fromLocalInput(values.startTime),
      endTime: fromLocalInput(values.endTime)
    } as EventFormValues);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" noValidate>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Controller
            name="startTime"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Início</FieldLabel>
                <Input {...field} type="datetime-local" aria-invalid={fieldState.invalid} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="endTime"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Término</FieldLabel>
                <Input {...field} type="datetime-local" aria-invalid={fieldState.invalid} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
        <Controller
          name="location"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Local</FieldLabel>
              <Input {...field} aria-invalid={fieldState.invalid} maxLength={128} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Descrição</FieldLabel>
              <Textarea {...field} aria-invalid={fieldState.invalid} rows={3} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </DialogFooter>
    </form>
  );
}
