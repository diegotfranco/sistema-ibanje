// Project wrapper around shadcn's Select primitive.
//
// Why this exists: shadcn's SelectContent defaults to position="item-aligned"
// (dropdown overlaps the trigger and aligns with the selected item). Our forms
// use position="popper" so the dropdown always opens below and matches the
// trigger width via --radix-select-trigger-width. Patching ui/select.tsx
// directly would be overwritten on the next `shadcn add select`. The wrapper
// overrides SelectContent, SelectTrigger, and SelectItem; every other export
// is re-exported unchanged.
//
// Always import Select parts from '@/components/Select' (not '@/components/ui/select').
import type { ComponentProps } from 'react';
import {
  Select,
  SelectContent as ShadcnSelectContent,
  SelectTrigger as ShadcnSelectTrigger,
  SelectItem as ShadcnSelectItem,
  SelectGroup,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type SelectContentProps = ComponentProps<typeof ShadcnSelectContent>;
type SelectTriggerProps = ComponentProps<typeof ShadcnSelectTrigger>;
type SelectItemProps = ComponentProps<typeof ShadcnSelectItem>;

function SelectContent({ position = 'popper', className, ...props }: SelectContentProps) {
  return (
    <ShadcnSelectContent
      position={position}
      className={cn(position === 'popper' && 'w-(--radix-select-trigger-width)', className)}
      {...props}
    />
  );
}

function SelectTrigger({ className, ...props }: SelectTriggerProps) {
  return <ShadcnSelectTrigger className={cn('aria-expanded:bg-muted', className)} {...props} />;
}

function SelectItem({ className, ...props }: SelectItemProps) {
  return <ShadcnSelectItem className={cn('focus:bg-muted', className)} {...props} />;
}

export {
  Select,
  SelectContent,
  SelectTrigger,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectValue
};
