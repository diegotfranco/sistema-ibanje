import { TrendingDown, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface MetricTileBadge {
  text: string;
  positive: boolean;
  neutral?: boolean;
  tooltip?: string;
}

interface MetricTileProps {
  label: string;
  value: string;
  badge?: MetricTileBadge;
  meta?: string;
  isLoading?: boolean;
  className?: string;
}

export function MetricTile({ label, value, badge, meta, isLoading, className }: MetricTileProps) {
  if (isLoading) {
    return (
      <div className={`space-y-2 rounded-lg border border-border bg-card p-4 ${className ?? ''}`}>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-28" />
      </div>
    );
  }

  const badgeColor = badge?.neutral
    ? 'bg-muted text-muted-foreground'
    : badge?.positive
      ? 'bg-money-in/10 text-money-in'
      : 'bg-money-out/10 text-money-out';

  const TrendIcon = badge?.positive ? TrendingUp : TrendingDown;

  const badgeEl = badge ? (
    <div
      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold ${badgeColor}`}>
      {!badge.neutral && <TrendIcon className="h-4 w-4" />}
      <span className="font-mono tabular-nums">{badge.text}</span>
    </div>
  ) : null;

  return (
    <div
      className={`rounded-lg border border-border bg-card p-4 min-h-28 flex flex-col items-end ${className ?? ''}`}>
      <div className="flex-1 w-full">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-medium text-foreground">{value}</p>
      </div>
      {badge?.tooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>{badgeEl}</TooltipTrigger>
          <TooltipContent>{badge.tooltip}</TooltipContent>
        </Tooltip>
      ) : (
        badgeEl
      )}
      {meta && (
        <p className="text-xs text-muted-foreground font-mono tabular-nums text-right">{meta}</p>
      )}
    </div>
  );
}
