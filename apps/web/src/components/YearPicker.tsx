import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button, buttonVariants } from '@/components/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Props {
  years: number[];
  value: number | undefined;
  onChange: (year: number | undefined) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
}

export function YearPicker({
  years,
  value,
  onChange,
  placeholder = 'Todos',
  id,
  className,
  disabled
}: Props) {
  const [open, setOpen] = useState(false);

  function select(year: number | undefined) {
    onChange(year);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            'justify-between aria-expanded:ring-1 aria-expanded:ring-ring/50',
            className
          )}>
          <Calendar className="mr-2 h-4 w-4" />
          <span className={cn('tabular-nums', value === undefined && 'text-muted-foreground')}>
            {value !== undefined ? String(value) : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-1" align="start">
        <button
          type="button"
          onClick={() => select(undefined)}
          className={cn(
            buttonVariants({ variant: value === undefined ? 'default' : 'ghost' }),
            'w-full justify-start font-normal'
          )}>
          {placeholder}
        </button>
        {years.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => select(y)}
            className={cn(
              buttonVariants({ variant: value === y ? 'default' : 'ghost' }),
              'w-full justify-start font-normal tabular-nums'
            )}>
            {y}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
