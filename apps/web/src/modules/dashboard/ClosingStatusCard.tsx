import { useNavigate } from 'react-router';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Lock, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatMonthForBanner } from './dashboard-utils';
import type { Closing } from '@sistema-ibanje/shared';

interface ClosingStatusCardProps {
  data: Closing | undefined;
  month: string;
  isLoading?: boolean;
}

type Tone = 'danger' | 'action' | 'review' | 'success' | 'muted';

const toneStyles: Record<Tone, { accent: string; icon: string; badge: string }> = {
  danger: {
    accent: 'border-l-destructive',
    icon: 'text-destructive',
    badge: 'border-destructive/30 bg-destructive/10 text-destructive'
  },
  action: {
    accent: 'border-l-primary',
    icon: 'text-primary',
    badge: 'border-primary/30 bg-primary/10 text-primary'
  },
  review: {
    accent: 'border-l-amber-500',
    icon: 'text-amber-500',
    badge: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
  },
  success: {
    accent: 'border-l-money-in',
    icon: 'text-money-in',
    badge: 'border-money-in/30 bg-money-in/10 text-money-in'
  },
  muted: {
    accent: 'border-l-muted-foreground/40',
    icon: 'text-muted-foreground',
    badge: 'border-border bg-muted text-muted-foreground'
  }
};

const statusLabel: Record<NonNullable<Closing['status']>, string> = {
  aberto: 'Aberto',
  'em revisão': 'Em revisão',
  rejeitado: 'Rejeitado',
  aprovado: 'Aprovado',
  fechado: 'Fechado'
};

const statusTone: Record<NonNullable<Closing['status']>, Tone> = {
  aberto: 'action',
  'em revisão': 'review',
  rejeitado: 'danger',
  aprovado: 'success',
  fechado: 'muted'
};

export function ClosingStatusCard({ data, month, isLoading }: ClosingStatusCardProps) {
  const navigate = useNavigate();

  if (isLoading || !data) {
    return (
      <Card>
        <CardContent className="space-y-4 py-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-40" />
            </div>
            <Skeleton className="h-9 w-28" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasPriorPending = data.priorPendingCount > 0;
  const monthLabel = formatMonthForBanner(month);

  // Decide the card's primary framing tone + icon + headline + CTA.
  let tone: Tone;
  let Icon: typeof AlertTriangle;
  let headline: string;
  let badgeText: string | null;
  let onCta: () => void;

  if (hasPriorPending) {
    tone = 'danger';
    Icon = AlertTriangle;
    headline = `Existe${data.priorPendingCount > 1 ? 'm' : ''} ${data.priorPendingCount} fechamento${
      data.priorPendingCount > 1 ? 's' : ''
    } pendente${data.priorPendingCount > 1 ? 's' : ''} de meses anteriores`;
    badgeText = 'Atrasado';
    onCta = () => {
      if (data.oldestPendingId) navigate(`/monthly-closings/${data.oldestPendingId}`);
      else navigate('/monthly-closings');
    };
  } else if (!data.status) {
    tone = 'action';
    Icon = Plus;
    headline = `Criar fechamento de ${monthLabel}`;
    badgeText = null;
    onCta = () => navigate('/monthly-closings');
  } else {
    tone = statusTone[data.status];
    Icon =
      data.status === 'aprovado'
        ? CheckCircle2
        : data.status === 'rejeitado'
          ? AlertTriangle
          : data.status === 'fechado'
            ? Lock
            : Clock;
    headline = `Fechamento de ${monthLabel}`;
    badgeText = statusLabel[data.status];
    onCta = () => {
      if (data.currentMonthId) navigate(`/monthly-closings/${data.currentMonthId}`);
    };
  }

  const styles = toneStyles[tone];

  return (
    <Card className={cn('border-l-4', styles.accent)}>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Icon className={cn('h-5 w-5 shrink-0', styles.icon)} />
            <p className="font-medium text-foreground leading-tight truncate">{headline}</p>
          </div>
          {badgeText && (
            <Badge variant="outline" className={cn('shrink-0', styles.badge)}>
              {badgeText}
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          {hasPriorPending && data.status ? (
            <p className="text-xs text-muted-foreground">
              Atual ({monthLabel}): {statusLabel[data.status]}
            </p>
          ) : (
            <span />
          )}
          <Button
            size="sm"
            onClick={onCta}
            variant="ghost"
            aria-label={`Ver ${headline}`}
            className="h-7 w-7 p-0">
            <ArrowRight className={cn('h-4 w-4', styles.icon)} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
