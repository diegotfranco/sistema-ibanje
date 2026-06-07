import { MetricTile } from './MetricTile';
import type { ParticipationMetric } from '@sistema-ibanje/shared';

interface ParticipationCardProps {
  title: string;
  data: ParticipationMetric | undefined;
  isLoading?: boolean;
}

export function ParticipationCard({ title, data, isLoading }: ParticipationCardProps) {
  if (!data && !isLoading) {
    return null;
  }

  const currentPct = data ? Number.parseFloat(data.currentPct) : 0;
  const deltaPct = data ? Number.parseFloat(data.deltaPct) : 0;
  const deltaPctAbs = Math.abs(deltaPct).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
  const isNeutral = deltaPct === 0;
  const isDeltaPositive = deltaPct > 0;

  const variation = isNeutral
    ? 'Sem variação nos últimos 6 meses'
    : isDeltaPositive
      ? `Aumento de ${deltaPctAbs}% nos últimos 6 meses`
      : `Queda de ${deltaPctAbs}% nos últimos 6 meses`;

  return (
    <MetricTile
      label={title}
      value={`${currentPct.toFixed(1)}%`}
      badge={{
        text: `${deltaPctAbs}%`,
        positive: isDeltaPositive,
        neutral: isNeutral,
        tooltip: variation
      }}
      isLoading={isLoading}
    />
  );
}
