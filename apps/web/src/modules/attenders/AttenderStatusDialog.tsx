import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { Button } from '@/components/Button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/Dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import DateInput from '@/components/DateInput';
import { AttenderStatus, type AttenderStatusValue } from '@sistema-ibanje/shared';
import { ATTENDER_STATUS_LABELS, allowedAttenderTargets, isAttenderTerminal } from '@/lib/status';
import { useMembershipLetters } from '@/modules/membership-letters/useMembershipLetters';
import { formatDate } from '@/lib/datetime';
import { AttenderStatusChangeSchema, type AttenderStatusChangeValues } from './schema';
import type { AttenderResponse } from './schema';

// Sentinel for the "no letter" option — Select forbids an empty string value.
const NO_LETTER = '__none__';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  attender: AttenderResponse | null;
  onSubmit: (values: AttenderStatusChangeValues) => void;
  isPending: boolean;
  formRef?: React.Ref<ReturnType<typeof useForm<AttenderStatusChangeValues>> | null>;
}

export default function AttenderStatusDialog({
  open,
  onOpenChange,
  attender,
  onSubmit,
  isPending,
  formRef
}: Props) {
  const current = (attender?.status ?? AttenderStatus.Active) as AttenderStatusValue;

  const form = useForm<AttenderStatusChangeValues>({
    resolver: zodResolver(AttenderStatusChangeSchema),
    defaultValues: {
      status: current,
      exitDate: attender?.exitDate ?? null,
      exitReason: attender?.exitReason ?? null,
      exitLetterId: attender?.exitLetterId ?? null
    }
  });

  const {
    handleSubmit,
    reset,
    control,
    register,
    formState: { errors }
  } = form;

  useEffect(() => {
    if (formRef && 'current' in formRef) formRef.current = form;
    if (open && attender) {
      reset({
        status: attender.status as AttenderStatusValue,
        exitDate: attender.exitDate,
        exitReason: attender.exitReason,
        exitLetterId: attender.exitLetterId
      });
    }
  }, [open, attender, reset, form, formRef]);

  const selectedStatus = (useWatch({ control, name: 'status' }) ?? current) as AttenderStatusValue;
  const showExit = isAttenderTerminal(selectedStatus);
  const isTransfer = selectedStatus === AttenderStatus.Transferred;

  // Carta de transferência options for this member (optional link; the letter is often issued
  // weeks after the transfer, so it can be attached later by reopening this dialog).
  const letters = useMembershipLetters(
    isTransfer && attender ? { attenderId: attender.id, type: 'carta_de_transferência' } : undefined
  );

  // The dropdown offers the current state plus every legal target, so the operator can also
  // just re-save to attach a transfer letter later.
  const statusOptions = [current, ...allowedAttenderTargets(current)];

  function prepare(values: AttenderStatusChangeValues): AttenderStatusChangeValues {
    const terminal = isAttenderTerminal(values.status);
    return {
      status: values.status,
      exitDate: terminal ? values.exitDate || null : null,
      exitReason: terminal ? values.exitReason?.trim() || null : null,
      exitLetterId:
        values.status === AttenderStatus.Transferred ? (values.exitLetterId ?? null) : null
    };
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar situação — {attender?.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => onSubmit(prepare(v)))} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="status">Situação *</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => field.onChange(v as AttenderStatusValue)}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {ATTENDER_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
          </div>

          {showExit && (
            <>
              <div className="space-y-1">
                <Label htmlFor="exitDate">Data de saída *</Label>
                <Controller
                  control={control}
                  name="exitDate"
                  render={({ field }) => (
                    <DateInput
                      id="exitDate"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  )}
                />
                {errors.exitDate && (
                  <p className="text-xs text-destructive">{errors.exitDate.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="exitReason">Motivo</Label>
                <Input id="exitReason" maxLength={256} {...register('exitReason')} />
                {errors.exitReason && (
                  <p className="text-xs text-destructive">{errors.exitReason.message}</p>
                )}
              </div>
            </>
          )}

          {isTransfer && (
            <div className="space-y-1">
              <Label htmlFor="exitLetterId">Carta de transferência</Label>
              <Controller
                control={control}
                name="exitLetterId"
                render={({ field }) => (
                  <Select
                    value={field.value != null ? String(field.value) : NO_LETTER}
                    onValueChange={(v) => field.onChange(v === NO_LETTER ? null : Number(v))}>
                    <SelectTrigger id="exitLetterId" className="w-full">
                      <SelectValue placeholder="Nenhuma (pode vincular depois)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_LETTER}>Nenhuma (pode vincular depois)</SelectItem>
                      {letters.data?.data.map((l) => (
                        <SelectItem key={l.id} value={String(l.id)}>
                          {formatDate(l.letterDate)} — {l.otherChurchName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.exitLetterId && (
                <p className="text-xs text-destructive">{errors.exitLetterId.message}</p>
              )}
            </div>
          )}

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
