// Project wrapper around shadcn's Collapsible primitive.
//
// Why this exists: the project's CollapsibleTrigger needs `cursor-pointer` +
// `flex items-center` (UX + alignment), and CollapsibleContent needs
// `overflow-hidden` so the open/close transition doesn't bleed past the panel.
// Patching ui/collapsible.tsx would be overwritten by the next
// `shadcn add collapsible`. Wrapping keeps the styling intact across re-syncs.
//
// Always import these from '@/components/Collapsible' (not '@/components/ui/collapsible').
import type { ComponentProps } from 'react';
import {
  Collapsible,
  CollapsibleTrigger as ShadcnCollapsibleTrigger,
  CollapsibleContent as ShadcnCollapsibleContent
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

function CollapsibleTrigger({
  className,
  ...props
}: ComponentProps<typeof ShadcnCollapsibleTrigger>) {
  return (
    <ShadcnCollapsibleTrigger
      className={cn('flex items-center cursor-pointer', className)}
      {...props}
    />
  );
}

function CollapsibleContent({
  className,
  ...props
}: ComponentProps<typeof ShadcnCollapsibleContent>) {
  return <ShadcnCollapsibleContent className={cn('overflow-hidden', className)} {...props} />;
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
