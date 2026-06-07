// Project wrapper around shadcn's DropdownMenu primitive.
//
// Overrides focus/open background from `accent` to `muted` on interactive items
// so hover/focus states match the muted palette used throughout the app.
// All other exports are re-exported unchanged.
//
// Always import DropdownMenu parts from '@/components/DropdownMenu' (not '@/components/ui/dropdown-menu').
import type { ComponentProps } from 'react';
import {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem as ShadcnDropdownMenuItem,
  DropdownMenuCheckboxItem as ShadcnDropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem as ShadcnDropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger as ShadcnDropdownMenuSubTrigger,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type DropdownMenuItemProps = ComponentProps<typeof ShadcnDropdownMenuItem>;
type DropdownMenuCheckboxItemProps = ComponentProps<typeof ShadcnDropdownMenuCheckboxItem>;
type DropdownMenuRadioItemProps = ComponentProps<typeof ShadcnDropdownMenuRadioItem>;
type DropdownMenuSubTriggerProps = ComponentProps<typeof ShadcnDropdownMenuSubTrigger>;

function DropdownMenuItem({ className, ...props }: DropdownMenuItemProps) {
  return <ShadcnDropdownMenuItem className={cn('focus:bg-muted', className)} {...props} />;
}

function DropdownMenuCheckboxItem({ className, ...props }: DropdownMenuCheckboxItemProps) {
  return <ShadcnDropdownMenuCheckboxItem className={cn('focus:bg-muted', className)} {...props} />;
}

function DropdownMenuRadioItem({ className, ...props }: DropdownMenuRadioItemProps) {
  return <ShadcnDropdownMenuRadioItem className={cn('focus:bg-muted', className)} {...props} />;
}

function DropdownMenuSubTrigger({ className, ...props }: DropdownMenuSubTriggerProps) {
  return (
    <ShadcnDropdownMenuSubTrigger
      className={cn('focus:bg-muted data-open:bg-muted', className)}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
};
