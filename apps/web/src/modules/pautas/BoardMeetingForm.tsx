import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import DateInput from '@/components/DateInput';
import { BoardMeetingFormSchema, type BoardMeetingFormValues } from '@/schemas/board-meeting';

const EMPTY: BoardMeetingFormValues = { meetingDate: '', type: 'ordinária', isPublic: false };

interface BoardMeetingFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultValues?: BoardMeetingFormValues;
  onSubmit: (values: BoardMeetingFormValues) => void;
  isPending: boolean;
}

export default function BoardMeetingForm({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  isPending
}: BoardMeetingFormProps) {
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<BoardMeetingFormValues>({
    resolver: zodResolver(BoardMeetingFormSchema),
    defaultValues: defaultValues ?? EMPTY
  });

  useEffect(() => {
    if (open) reset(defaultValues ?? EMPTY);
  }, [open, defaultValues, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{defaultValues ? 'Editar Reunião' : 'Nova Reunião'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="meetingDate">Data *</Label>
            <DateInput id="meetingDate" {...register('meetingDate')} />
            {errors.meetingDate && <p className="text-xs text-red-500">{errors.meetingDate.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Tipo *</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ordinária">Ordinária</SelectItem>
                    <SelectItem value="extraordinária">Extraordinária</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
          </div>

          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="isPublic"
              render={({ field }) => (
                <Checkbox
                  id="isPublic"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="isPublic">Reunião pública</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
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
