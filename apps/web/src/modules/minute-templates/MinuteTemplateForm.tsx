import { useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { autofillSafeSubmit } from '@/lib/forms';
import { MeetingType } from '@sistema-ibanje/shared';
import { Button } from '@/components/Button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/Dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronUp, ChevronDown, X, Plus } from 'lucide-react';
import { RichTextEditor, type TipTapDoc, EMPTY_TIPTAP_DOC } from '@/components/RichTextEditor';
import {
  MinuteTemplateFormSchema,
  type MinuteTemplateFormValues,
  type MinuteTemplateResponse
} from './schema';

const EMPTY: MinuteTemplateFormValues = {
  meetingType: MeetingType.Ordinary,
  name: '',
  content: EMPTY_TIPTAP_DOC,
  isDefault: false,
  defaultAgendaItems: []
} as MinuteTemplateFormValues;

interface MinuteTemplateFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (values: MinuteTemplateFormValues) => void;
  isPending: boolean;
  initialData?: MinuteTemplateResponse;
}

export default function MinuteTemplateForm({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  initialData
}: MinuteTemplateFormProps) {
  const form = useForm<MinuteTemplateFormValues>({
    resolver: zodResolver(MinuteTemplateFormSchema),
    defaultValues: initialData ? (initialData as MinuteTemplateFormValues) : EMPTY
  });
  const {
    register,
    reset,
    control,
    formState: { errors }
  } = form;

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'defaultAgendaItems'
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset(initialData as MinuteTemplateFormValues);
      } else {
        reset(EMPTY);
      }
    }
  }, [open, initialData, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Modelo' : 'Novo Modelo de Ata'}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={autofillSafeSubmit(form, (v) => {
            const cleaned = {
              ...v,
              defaultAgendaItems: v.defaultAgendaItems.map(
                (item: (typeof v.defaultAgendaItems)[number]) => ({
                  ...item,
                  description: item.description === '' ? null : item.description
                })
              )
            } as MinuteTemplateFormValues;
            onSubmit(cleaned);
          })}
          className="space-y-4">
          <Field data-invalid={!!errors.name || undefined}>
            <FieldLabel htmlFor="name">Nome *</FieldLabel>
            <Input id="name" {...register('name')} aria-invalid={!!errors.name || undefined} />
            {errors.name && <FieldError errors={[errors.name]} />}
          </Field>

          <Field data-invalid={!!errors.meetingType || undefined}>
            <FieldLabel htmlFor="meetingType">Tipo de Reunião *</FieldLabel>
            <Controller
              control={control}
              name="meetingType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!!initialData}>
                  <SelectTrigger id="meetingType" aria-invalid={!!errors.meetingType || undefined}>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={MeetingType.Ordinary}>Ordinária</SelectItem>
                    <SelectItem value={MeetingType.Extraordinary}>Extraordinária</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.meetingType && <FieldError errors={[errors.meetingType]} />}
          </Field>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Controller
                control={control}
                name="isDefault"
                render={({ field }) => (
                  <Checkbox id="isDefault" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <Label htmlFor="isDefault" className="font-normal cursor-pointer">
                Modelo Padrão
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Se marcado, este modelo será usado ao criar novas reuniões deste tipo
            </p>
          </div>

          <Field data-invalid={!!errors.content || undefined}>
            <FieldLabel>Conteúdo *</FieldLabel>
            <Controller
              control={control}
              name="content"
              render={({ field }) => (
                <RichTextEditor value={field.value as TipTapDoc} onChange={field.onChange} />
              )}
            />
            {errors.content && <FieldError errors={[errors.content]} />}
          </Field>

          <div className="space-y-2">
            <Label>Itens de Pauta Padrão</Label>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 p-3 border rounded-md bg-muted/30">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Título do item"
                      {...register(`defaultAgendaItems.${index}.title`)}
                      aria-invalid={!!errors.defaultAgendaItems?.[index]?.title || undefined}
                    />
                    <Textarea
                      placeholder="Descrição"
                      {...register(`defaultAgendaItems.${index}.description`)}
                      rows={2}
                    />
                    {errors.defaultAgendaItems?.[index]?.title && (
                      <FieldError errors={[errors.defaultAgendaItems[index]?.title]} />
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => index > 0 && move(index, index - 1)}
                      disabled={index === 0}
                      className="h-8 w-8 p-0">
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => index < fields.length - 1 && move(index, index + 1)}
                      disabled={index === fields.length - 1}
                      className="h-8 w-8 p-0">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive/80">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ title: '', description: '' })}
              className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Item
            </Button>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
