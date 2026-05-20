import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/Button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type Props = Omit<React.ComponentPropsWithoutRef<typeof Input>, 'type'>;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function isoToBr(iso: string): string {
  if (!iso || typeof iso !== 'string') return '';
  const trimmed = iso.trim();
  if (trimmed.length !== 10 || trimmed[4] !== '-' || trimmed[7] !== '-') return '';
  const year = trimmed.slice(0, 4);
  const month = trimmed.slice(5, 7);
  const day = trimmed.slice(8, 10);
  return `${day}/${month}/${year}`;
}

function brToIso(br: string): string | null {
  if (!br || typeof br !== 'string') return null;
  const trimmed = br.trim();
  if (trimmed.length !== 10 || trimmed[2] !== '/' || trimmed[5] !== '/') return null;
  const dayStr = trimmed.slice(0, 2);
  const monthStr = trimmed.slice(3, 5);
  const yearStr = trimmed.slice(6, 10);

  const day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (day < 1 || day > 31) return null;
  if (month < 1 || month > 12) return null;
  if (year < 1900 || year > 2999) return null;

  return `${yearStr}-${monthStr}-${dayStr}`;
}

function applyMask(raw: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

function isoToLocalDate(iso: string): Date | undefined {
  if (!iso || iso.length !== 10) return undefined;
  const y = parseInt(iso.slice(0, 4), 10);
  const m = parseInt(iso.slice(5, 7), 10);
  const d = parseInt(iso.slice(8, 10), 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return undefined;
  return new Date(y, m - 1, d);
}

function localDateToIso(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export default React.forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, onBlur, name, className, disabled, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState<string>(() => isoToBr(value as string));
    const [open, setOpen] = React.useState(false);

    React.useEffect(() => {
      setDisplayValue(isoToBr(value as string));
    }, [value]);

    const emit = (iso: string) => {
      const syntheticEvent = {
        target: { value: iso, name }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange?.(syntheticEvent);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const masked = applyMask(e.currentTarget.value);
      setDisplayValue(masked);
      const iso = brToIso(masked);
      emit(iso ?? '');
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (!brToIso(displayValue)) setDisplayValue('');
      onBlur?.(e);
    };

    const handleCalendarSelect = (date: Date | undefined) => {
      if (!date) return;
      const iso = localDateToIso(date);
      setDisplayValue(isoToBr(iso));
      emit(iso);
      setOpen(false);
    };

    const selected = isoToLocalDate(typeof value === 'string' ? value : '');

    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          placeholder="dd/mm/aaaa"
          maxLength={10}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          name={name}
          disabled={disabled}
          {...props}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={disabled}
              data-input-trigger=""
              aria-label="Abrir calendário"
              className="shrink-0">
              <CalendarIcon size={16} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selected}
              defaultMonth={selected}
              onSelect={handleCalendarSelect}
              locale={ptBR}
              captionLayout="dropdown"
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);
