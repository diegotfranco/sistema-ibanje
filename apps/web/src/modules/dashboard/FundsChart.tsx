import { useFundsReport } from '@/modules/finance/reports/useReports';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney, formatDate, isDatePast } from './dashboard-utils';
import type { FundSummary } from '@/schemas/report';

export function FundsChart() {
  const { data, isLoading } = useFundsReport();
  const funds = data?.funds || [];

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (funds.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
        <p className="text-sm text-muted-foreground">Nenhum fundo cadastrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {funds.map((fund: FundSummary) => (
        <div key={fund.fundId} className="space-y-2 rounded-lg border border-border bg-card p-4">
          {/* Fund name and target date chip */}
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">{fund.fundName}</h4>
            <div className="flex items-center gap-2">
              {fund.targetDate && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    isDatePast(fund.targetDate)
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-primary/15 text-primary'
                  }`}>
                  {isDatePast(fund.targetDate) ? (
                    <>✓ Encerrado em {formatDate(fund.targetDate)}</>
                  ) : (
                    <>⏳ Encerra {formatDate(fund.targetDate)}</>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground">Arrecadado</span>
              <span className="font-semibold text-foreground">{formatMoney(fund.totalRaised)}</span>
            </div>
            {fund.targetAmount && (
              <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full transition-all ${
                    fund.targetDate && isDatePast(fund.targetDate)
                      ? 'bg-muted-foreground opacity-50'
                      : 'bg-primary'
                  }`}
                  style={{
                    width: `${Math.min(
                      (Number.parseFloat(fund.totalRaised) / Number.parseFloat(fund.targetAmount)) *
                        100,
                      100
                    )}%`
                  }}
                />
              </div>
            )}
            {fund.targetAmount ? (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Meta: {formatMoney(fund.targetAmount)}</span>
                <span>
                  {fund.progressPercentage
                    ? `${fund.progressPercentage}% alcançado`
                    : '0% alcançado'}
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">(sem meta)</p>
            )}
          </div>

          {/* Balance if target is set */}
          {fund.targetAmount && (
            <div className="text-xs text-muted-foreground">Saldo: {formatMoney(fund.balance)}</div>
          )}
        </div>
      ))}
    </div>
  );
}
