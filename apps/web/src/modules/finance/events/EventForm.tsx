import { Controller, useForm, type Control } from 'react-hook-form';
import { Button } from '@/components/Button';
import { DialogFooter } from '@/components/Dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import DateInput from '@/components/DateInput';
import { TimeInput } from '@/components/TimeInput';
import { zodResolver } from '@/lib/zodResolver';
import { EventFormSchema, type EventFormValues, type EventResponse } from './schema';

interface Props {
  initialValues?: EventResponse;
  isPending: boolean;
  onSubmit: (values: EventFormValues) => void;
  onCancel: () => void;
}

// Each timestamp lives in the form as a local `YYYY-MM-DDTHH:mm` string (no zone) — the same value
// the old <input type="datetime-local"> produced, so the schema and `fromLocalInput` are unchanged.
// We render it as a dd/mm/aaaa DateInput + a 24h time input and split/join the two halves here, so
// dates read consistently with the rest of the app instead of the browser's locale-dependent format.
function toLocalInput(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(local: string): string {
  return new Date(local).toISOString();
}

function splitLocal(local: string): { date: string; time: string } {
  if (!local) return { date: '', time: '' };
  const [date = '', time = ''] = local.split('T');
  return { date, time: time.slice(0, 5) };
}

function joinLocal(date: string, time: string): string {
  if (!date) return '';
  return `${date}T${time || '00:00'}`;
}

function DateTimeField({
  control,
  name,
  label,
  idPrefix
}: {
  control: Control<EventFormValues>;
  name: 'startTime' | 'endTime';
  label: string;
  idPrefix: string;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const { date, time } = splitLocal(field.value);
        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`${idPrefix}-date`}>{label}</FieldLabel>
            <div className="flex gap-2">
              <DateInput
                id={`${idPrefix}-date`}
                className="flex-1"
                value={date}
                onChange={(e) => field.onChange(joinLocal(e.target.value, time))}
                onBlur={field.onBlur}
                aria-invalid={fieldState.invalid || undefined}
              />
              <TimeInput
                aria-label={`${label} (hora)`}
                className="w-28 shrink-0"
                value={time}
                onChange={(e) => field.onChange(joinLocal(date, e.target.value))}
                onBlur={field.onBlur}
                aria-invalid={fieldState.invalid || undefined}
              />
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DateTimeField control={form.control} name="startTime" label="Início" idPrefix="start" />
          <DateTimeField control={form.control} name="endTime" label="Término" idPrefix="end" />
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
