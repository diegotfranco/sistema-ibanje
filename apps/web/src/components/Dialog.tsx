// Project wrapper around shadcn's Dialog primitives.
//
// Why this exists: the shadcn DialogContent is vertically centered with no height
// cap, so a tall dialog (e.g. the permissions matrix) grows past the viewport and
// clips its own footer. This wrapper injects a default `max-h-[90vh] overflow-y-auto`
// so no dialog can ever exceed the viewport — including future ones. Patching that
// into ui/dialog.tsx would be overwritten by the next `shadcn add dialog`.
//
// `cn` is twMerge(clsx(...)), so the default is overridable per-call: a dialog that
// needs a pinned header/footer with an internal scroll body passes
// `flex flex-col overflow-hidden` and tailwind-merge keeps the caller's classes.
//
// Always import dialog parts from '@/components/Dialog' (not '@/components/ui/dialog').
import type { ComponentProps } from 'react';
import { DialogContent as ShadcnDialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

function DialogContent({ className, ...props }: ComponentProps<typeof ShadcnDialogContent>) {
  return (
    <ShadcnDialogContent className={cn('max-h-[90vh] overflow-y-auto', className)} {...props} />
  );
}

export { DialogContent };
export {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
