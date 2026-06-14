import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// shadcn "Date and Time Picker" time field: the shadcn Input with `type="time"`, styled to drop
// the native clock/spinner glyph so it reads like any other field. The 12h/24h display follows the
// OS locale (not controllable from here) — that's acceptable.
// https://ui.shadcn.com/docs/components/radix/date-picker#time-picker
export function TimeInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <Input
      type="time"
      className={cn(
        'appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none',
        className
      )}
      {...props}
    />
  );
}
