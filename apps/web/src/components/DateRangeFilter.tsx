import { useState } from 'react';
import { ListFilter } from 'lucide-react';
import { ptBR } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/Button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { isoToLocalDate, localDateToIso } from '@/lib/datetime';
import { cn } from '@/lib/utils';

export type IsoDateRange = { from?: string; to?: string };

type Props = {
  value: IsoDateRange;
  onChange: (range: IsoDateRange) => void;
  /** Accessible label for the funnel trigger. */
  label?: string;
};

// Column-header date-range filter: a funnel icon (matching DataTable's per-column ColumnFilterMenu
// affordance) that opens a two-month range calendar. Values are ISO `YYYY-MM-DD` in/out so callers
// can drop them straight into a query string; react-day-picker works in `Date`, so we bridge with
// the shared isoToLocalDate / localDateToIso helpers.
export function DateRangeFilter({ value, onChange, label = 'Filtrar por período' }: Props) {
  const [open, setOpen] = useState(false);
  const active = !!value.from || !!value.to;

  const selected: DateRange | undefined = value.from
    ? { from: isoToLocalDate(value.from), to: isoToLocalDate(value.to) }
    : undefined;

  const handleSelect = (range: DateRange | undefined) => {
    onChange({
      from: range?.from ? localDateToIso(range.from) : undefined,
      to: range?.to ? localDateToIso(range.to) : undefined
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={label}
          className={cn(active ? 'text-primary' : 'text-muted-foreground')}>
          <ListFilter size={14} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={selected}
          defaultMonth={selected?.from}
          onSelect={handleSelect}
          locale={ptBR}
          captionLayout="dropdown"
        />
        <div className="flex justify-end border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={!active}
            onClick={() => {
              onChange({ from: undefined, to: undefined });
              setOpen(false);
            }}>
            Limpar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
