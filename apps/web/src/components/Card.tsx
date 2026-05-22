// Project wrapper around shadcn's Card primitive.
//
// Why this exists: the project wants `ring-foreground/15 shadow-xs` on every
// Card (slightly stronger ring + a subtle shadow). Putting that in ui/card.tsx
// would be overwritten the next time someone runs `shadcn add card`. Wrapping
// here keeps the customization safe across re-syncs.
//
// Always import Card from '@/components/Card' (not '@/components/ui/card').
// The other Card* parts re-export unchanged.
import type { ComponentProps } from 'react';
import {
  Card as ShadcnCard,
  CardAction,
  CardContent as ShadcnCardContent,
  CardDescription,
  CardFooter,
  CardHeader as ShadcnCardHeader,
  CardTitle as ShadcnCardTitle
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

type CardProps = ComponentProps<typeof ShadcnCard>;
type CardHeaderProps = ComponentProps<typeof ShadcnCardHeader>;
type CardTitleProps = ComponentProps<typeof ShadcnCardTitle>;
type CardContentProps = ComponentProps<typeof ShadcnCardContent>;

function Card({ className, ...props }: CardProps) {
  return (
    <ShadcnCard
      className={cn(
        'gap-0 ring-foreground/15 shadow-md dark:shadow-xs has-data-[slot=card-header]:pt-0',
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: CardHeaderProps) {
  return <ShadcnCardHeader className={cn('bg-muted py-3', className)} {...props} />;
}

function CardHeaderRow({ className, ...props }: CardHeaderProps) {
  return (
    <CardHeader
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: CardTitleProps) {
  return <ShadcnCardTitle className={cn('text-primary-soft', className)} {...props} />;
}

function CardContent({ className, ...props }: CardContentProps) {
  return <ShadcnCardContent className={cn('', className)} {...props} />;
}

export {
  Card,
  CardHeader,
  CardHeaderRow,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent
};
