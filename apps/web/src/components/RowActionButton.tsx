import type { ReactNode } from 'react';
import { Button } from '@/components/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface RowActionButtonProps {
  /** Single source of truth — drives both the tooltip text and the `aria-label`. */
  label: string;
  /** A lucide icon element, e.g. `<Edit className="h-4 w-4" />`. */
  icon: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** Preserves per-call semantic-color overrides (e.g. `text-destructive`). */
  className?: string;
  /** Canonical size is `icon-sm`; `icon-xs` is available for dense surfaces. */
  size?: 'icon-xs' | 'icon-sm';
}

/**
 * The single primitive every table row-action icon button goes through. It pairs
 * a neutral ghost icon `Button` with a shadcn `Tooltip` and a matching `aria-label`,
 * both fed by the one `label` prop — so a button can never gain a tooltip without
 * its accessible name, or drift to a different word between hover and screen reader.
 *
 * Note: Radix tooltips don't fire on a `disabled` trigger (no pointer events), so a
 * disabled action simply shows no bubble while disabled — acceptable for row actions.
 */
export function RowActionButton({
  label,
  icon,
  onClick,
  disabled,
  className,
  size = 'icon-sm'
}: RowActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          className={className}>
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
