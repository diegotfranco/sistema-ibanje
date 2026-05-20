// Project wrapper around shadcn's Button primitive.
//
// Why this exists: the project's `link` variant uses `text-primary-soft` rather
// than `text-primary` (visually softer underline links). Patching that into
// ui/button.tsx would be overwritten by the next `shadcn add button`. The
// wrapper injects the override only when `variant="link"`, leaving every other
// variant untouched.
//
// Always import Button from '@/components/Button' (not '@/components/ui/button').
import type { ComponentProps } from 'react';
import { Button as ShadcnButton, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ButtonProps = ComponentProps<typeof ShadcnButton>;

function Button({ variant, className, ...props }: ButtonProps) {
  return (
    <ShadcnButton
      variant={variant}
      className={cn(variant === 'link' && 'text-primary-soft', className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
