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
// Width is a named `size` prop, not an ad-hoc per-dialog `max-w-*`. This keeps the whole
// app on one intentional scale (4 widths) instead of every dialog inventing its own. Height
// is handled once here (`max-h-[90vh] overflow-y-auto`) so dialogs never hand-set height —
// the only sanctioned variation is the pinned-header/footer scroll body (pass
// `className="flex flex-col overflow-hidden"`, which tailwind-merge swaps in).
//
// Always import dialog parts from '@/components/Dialog' (not '@/components/ui/dialog').
import type { ComponentProps } from 'react';
import { DialogContent as ShadcnDialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const DIALOG_SIZE = {
  sm: 'sm:max-w-sm', // ~384px — confirmations / tiny prompts
  md: 'sm:max-w-lg', // ~512px — DEFAULT; single-column forms
  lg: 'sm:max-w-2xl', // ~672px — two-column / address-style forms
  xl: 'sm:max-w-4xl' // ~896px — wide & tabular (permissions matrix, PDF preview)
} as const;

type DialogSize = keyof typeof DIALOG_SIZE;

function DialogContent({
  className,
  size = 'md',
  ...props
}: ComponentProps<typeof ShadcnDialogContent> & { size?: DialogSize }) {
  return (
    <ShadcnDialogContent
      className={cn('max-h-[90vh] overflow-y-auto', DIALOG_SIZE[size], className)}
      {...props}
    />
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
