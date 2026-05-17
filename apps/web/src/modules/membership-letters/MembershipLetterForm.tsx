import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import DateInput from '@/components/DateInput';
import EntityPicker from '@/components/EntityPicker';
import { zodResolver } from '@/lib/zodResolver';
import { ActiveStatus } from '@sistema-ibanje/shared';
import { useAttenders } from '@/modules/attenders/useAttenders';
import {
  MembershipLetterFormSchema,
  type MembershipLetterFormValues,
  type MembershipLetterResponse
} from '@/schemas/membership-letter';

interface Props {
  initialValues?: MembershipLetterResponse;
  isPending: boolean;
  onSubmit: (values: MembershipLetterFormValues) => void;
  onCancel: () => void;
}

const typeLabels = {
  pedido_de_carta_de_transferência: 'Pedido de Carta de Transferência',
  carta_de_transferência: 'Carta de Transferência'
};

export function MembershipLetterForm({ initialValues, isPending, onSubmit, onCancel }: Props) {
  const attenders = useAttenders();
  const activeAttenders = (attenders.data?.data ?? []).filter(
    (a) => a.status === ActiveStatus.Active
  );

  const form = useForm<MembershipLetterFormValues>({
    resolver: zodResolver(MembershipLetterFormSchema),
    defaultValues: {
      type: initialValues?.type ?? undefined,
      attenderId: initialValues?.attenderId ?? undefined,
      letterDate: initialValues?.letterDate ?? '',
      otherChurchName: initialValues?.otherChurchName ?? '',
      otherChurchAddress: initialValues?.otherChurchAddress ?? '',
      otherChurchCity: initialValues?.otherChurchCity ?? '',
      otherChurchState: initialValues?.otherChurchState ?? '',
      additionalContext: initialValues?.additionalContext ?? ''
    }
  });

  const isEditing = initialValues !== undefined;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FieldGroup>
        <Controller
          name="type"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Tipo de Carta</FieldLabel>
              <Select value={field.value ?? ''} onValueChange={field.onChange} disabled={isEditing}>
                <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                  <SelectValue placeholder="Selecionar tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="attenderId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Congregado</FieldLabel>
              <EntityPicker
                items={activeAttenders}
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? undefined)}
                getValue={(a) => a.id}
                getLabel={(a) => a.name}
                placeholder="Selecionar congregado..."
                emptyMessage="Nenhum congregado encontrado."
                isLoading={attenders.isLoading}
                className="w-full"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="letterDate"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Data da Carta</FieldLabel>
              <DateInput {...field} aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="otherChurchName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Nome da Igreja</FieldLabel>
              <input
                {...field}
                type="text"
                className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="otherChurchAddress"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Endereço da Igreja (opcional)</FieldLabel>
              <Textarea {...field} value={field.value ?? ''} rows={2} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="otherChurchCity"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Cidade</FieldLabel>
                <input
                  {...field}
                  type="text"
                  className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="otherChurchState"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>UF (opcional)</FieldLabel>
                <input
                  {...field}
                  type="text"
                  maxLength={2}
                  placeholder="SP"
                  className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        <Controller
          name="additionalContext"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Observações (opcional)</FieldLabel>
              <Textarea
                {...field}
                value={field.value ?? ''}
                placeholder="Informações adicionais..."
                rows={3}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar'}
        </Button>
      </DialogFooter>
    </form>
  );
}
