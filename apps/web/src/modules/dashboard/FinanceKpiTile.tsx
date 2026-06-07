import { MetricTile } from './MetricTile';
import { formatMoney } from './dashboard-utils';
import type { KpiDeltaType } from '@sistema-ibanje/shared';

interface FinanceKpiTileProps {
  label: string;
  data: KpiDeltaType | undefined;
  isLoading?: boolean;
}

export function FinanceKpiTile({ label, data, isLoading }: FinanceKpiTileProps) {
  if (!data && !isLoading) {
    return null;
  }

  const deltaPctNum = data ? Number.parseFloat(data.deltaPct) : 0;
  const deltaPctAbs = Math.abs(deltaPctNum).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });

  const badge = data
    ? { text: `${deltaPctAbs}%`, positive: deltaPctNum > 0, neutral: deltaPctNum === 0 }
    : undefined;

  return (
    <MetricTile
      label={label}
      value={data ? formatMoney(data.current) : '—'}
      badge={badge}
      isLoading={isLoading}
    />
  );
}
