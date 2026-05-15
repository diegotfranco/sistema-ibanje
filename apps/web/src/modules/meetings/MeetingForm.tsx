import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import DateInput from '@/components/DateInput';
import { MeetingType } from '@sistema-ibanje/shared';
import { MeetingFormSchema, type MeetingFormValues } from '@/schemas/meeting';

const EMPTY: MeetingFormValues = {
  meetingDate: '',
  type: MeetingType.Ordinary,
  isPublic: false
};

interface MeetingFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultValues?: MeetingFormValues;
  onSubmit: (values: MeetingFormValues) => void;
  isPending: boolean;
}

export default function MeetingForm({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  isPending
}: MeetingFormProps) {
  const {
    handleSubmit,
    reset,
    control,
    formState: { errors }
  } = useForm<MeetingFormValues>({
    resolver: zodResolver(MeetingFormSchema),
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
            <Controller
              control={control}
              name="meetingDate"
              render={({ field }) => (
                <DateInput
                  id="meetingDate"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  name={field.name}
                />
              )}
            />
            {errors.meetingDate && (
              <p className="text-xs text-red-500">{errors.meetingDate.message}</p>
            )}
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
                    <SelectItem value={MeetingType.Ordinary}>Ordinária</SelectItem>
                    <SelectItem value={MeetingType.Extraordinary}>Extraordinária</SelectItem>
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
                <Checkbox id="isPublic" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <Label htmlFor="isPublic">Reunião pública</Label>
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
