import { FinanceKpiTile } from './FinanceKpiTile';
import { MetricTile } from './MetricTile';
import type { FinanceKpis } from '@sistema-ibanje/shared';

interface FinanceKpiStripProps {
  data: FinanceKpis | undefined;
  isLoading?: boolean;
}

export function FinanceKpiStrip({ data, isLoading }: FinanceKpiStripProps) {
  const cashValue = data?.cashBalance
    ? `R$ ${Number.parseFloat(data.cashBalance.current).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '—';
  const cashMeta = data?.cashBalance?.asOf
    ? `até ${new Date(data.cashBalance.asOf).toLocaleDateString('pt-BR')}`
    : undefined;

  return (
    <>
      <FinanceKpiTile label="Entradas" data={data?.income} isLoading={isLoading} />
      <FinanceKpiTile label="Saídas" data={data?.expenses} isLoading={isLoading} />
      <FinanceKpiTile label="Balanço" data={data?.netResult} isLoading={isLoading} />
      <MetricTile label="Saldo" value={cashValue} meta={cashMeta} isLoading={isLoading} />
    </>
  );
}
