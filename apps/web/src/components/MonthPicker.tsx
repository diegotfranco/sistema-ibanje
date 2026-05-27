// Styled after https://github.com/gr3enk/shadcn-ui-monthpicker — popover-anchored
// month grid using a Calendar-style header (absolute-positioned chevrons + centered
// year label). API stays string-based (YYYY-MM) so it drops into our existing call
// sites without converting Date objects.
import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, buttonVariants } from '@/components/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const MONTH_LABELS_LONG = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

const MONTH_ROWS: { number: number; name: string }[][] = [
  [
    { number: 0, name: 'Jan' },
    { number: 1, name: 'Fev' },
    { number: 2, name: 'Mar' },
    { number: 3, name: 'Abr' }
  ],
  [
    { number: 4, name: 'Mai' },
    { number: 5, name: 'Jun' },
    { number: 6, name: 'Jul' },
    { number: 7, name: 'Ago' }
  ],
  [
    { number: 8, name: 'Set' },
    { number: 9, name: 'Out' },
    { number: 10, name: 'Nov' },
    { number: 11, name: 'Dez' }
  ]
];

interface Props {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  disabled?: boolean;
}

function parse(value: string): { year: number; month: number } {
  const [y, m] = value.split('-').map(Number);
  if (Number.isFinite(y) && Number.isFinite(m) && m >= 1 && m <= 12) {
    return { year: y, month: m - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

function format(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function MonthPicker({ value, onChange, id, className, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const { year: selectedYear, month: selectedMonth } = parse(value);
  const [menuYear, setMenuYear] = useState(selectedYear);

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setMenuYear(selectedYear);
      }}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn('justify-start font-normal aria-expanded:ring-1 aria-expanded:ring-ring/50', className)}>
          <Calendar className="mr-2 h-4 w-4 opacity-70" />
          <span className="tabular-nums">
            {MONTH_LABELS_LONG[selectedMonth]} {selectedYear}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-70 p-3" align="start">
        <div className="relative flex items-center justify-center pt-1">
          <button
            type="button"
            onClick={() => setMenuYear((y) => y - 1)}
            aria-label="Ano anterior"
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'absolute left-1 inline-flex h-7 w-7 items-center justify-center p-0'
            )}>
            <ChevronLeft className="h-4 w-4 opacity-50" />
          </button>
          <div className="text-sm font-medium tabular-nums">{menuYear}</div>
          <button
            type="button"
            onClick={() => setMenuYear((y) => y + 1)}
            aria-label="Próximo ano"
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'absolute right-1 inline-flex h-7 w-7 items-center justify-center p-0'
            )}>
            <ChevronRight className="h-4 w-4 opacity-50" />
          </button>
        </div>
        <table className="w-full border-collapse space-y-1">
          <tbody>
            {MONTH_ROWS.map((row, rowIdx) => (
              <tr key={rowIdx} className="mt-2 flex w-full">
                {row.map((m) => {
                  const isSelected = m.number === selectedMonth && menuYear === selectedYear;
                  return (
                    <td key={m.number} className="relative h-10 w-1/4 p-0 text-center text-sm">
                      <button
                        type="button"
                        onClick={() => {
                          onChange(format(menuYear, m.number));
                          setOpen(false);
                        }}
                        className={cn(
                          buttonVariants({ variant: isSelected ? 'default' : 'ghost' }),
                          'h-full w-full p-0 font-normal'
                        )}>
                        {m.name}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </PopoverContent>
    </Popover>
  );
}
