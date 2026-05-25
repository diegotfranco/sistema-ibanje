import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useFundsReport } from '@/modules/finance/reports/useReports';
import { Skeleton } from '@/components/ui/skeleton';
import { ProgressBar } from '@/components/ProgressBar';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { formatMoney, formatDate, isDatePast } from './dashboard-utils';
import type { FundSummary } from '@/modules/finance/reports/schema';

const chartConfig = {
  progress: { label: 'Progresso', color: 'var(--primary)' }
} satisfies ChartConfig;

function FundDetailCard({ fund }: { fund: FundSummary }) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-foreground">{fund.fundName}</h4>
        {fund.targetDate && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isDatePast(fund.targetDate)
                ? 'bg-muted text-muted-foreground'
                : 'bg-primary-soft/15 text-primary-soft'
            }`}>
            {isDatePast(fund.targetDate) ? (
              <>✓ Encerrado em {formatDate(fund.targetDate)}</>
            ) : (
              <>⏳ Encerra {formatDate(fund.targetDate)}</>
            )}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground">Arrecadado</span>
          <span className="font-semibold text-foreground">{formatMoney(fund.totalRaised)}</span>
        </div>
        {fund.targetAmount ? (
          <>
            <ProgressBar
              value={fund.totalRaised}
              target={fund.targetAmount}
              dimmed={Boolean(fund.targetDate && isDatePast(fund.targetDate))}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Meta: {formatMoney(fund.targetAmount)}</span>
              <span>
                {fund.progressPercentage ? `${fund.progressPercentage}% alcançado` : '0% alcançado'}
              </span>
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">(sem meta)</p>
        )}
      </div>
      {fund.targetAmount && (
        <div className="text-xs text-muted-foreground">Saldo: {formatMoney(fund.balance)}</div>
      )}
    </div>
  );
}

export function FundsChart() {
  const [selected, setSelected] = useState<string>('all');
  const { data, isLoading } = useFundsReport();

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const ongoingFunds = (data?.funds ?? []).filter(
    (f) => !f.targetDate || !isDatePast(f.targetDate)
  );

  if (ongoingFunds.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
        <p className="text-sm text-muted-foreground">Nenhuma campanha ativa</p>
      </div>
    );
  }

  const fundsWithTarget = ongoingFunds.filter((f) => f.targetAmount);
  const fundsWithoutTarget = ongoingFunds.filter((f) => !f.targetAmount);

  const chartData = fundsWithTarget.map((f) => {
    const v = Number.parseFloat(f.totalRaised);
    const t = Number.parseFloat(f.targetAmount!);
    const pct = t > 0 ? Math.min((v / t) * 100, 100) : 0;
    return {
      name: f.fundName,
      progress: Number(pct.toFixed(1)),
      raised: f.totalRaised,
      target: f.targetAmount!
    };
  });

  const selectedFund =
    selected !== 'all' ? ongoingFunds.find((f) => String(f.fundId) === selected) : null;

  return (
    <div className="space-y-4">
      <Select value={selected} onValueChange={setSelected}>
        <SelectTrigger className="w-full sm:w-72">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas (comparativo)</SelectItem>
          {ongoingFunds.map((f) => (
            <SelectItem key={f.fundId} value={String(f.fundId)}>
              {f.fundName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedFund ? (
        <FundDetailCard fund={selectedFund} />
      ) : (
        <div className="space-y-4">
          {chartData.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-4">
              <ChartContainer
                config={chartConfig}
                className="h-[max(240px,calc(var(--row-h)*var(--rows)))] w-full"
                style={
                  {
                    '--row-h': '36px',
                    '--rows': String(chartData.length)
                  } as React.CSSProperties
                }>
                <BarChart
                  accessibilityLayer
                  data={chartData}
                  layout="vertical"
                  margin={{ left: 12, right: 24, top: 8, bottom: 8 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    unit="%"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    width={140}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip
                    cursor={{ fill: 'var(--muted)', opacity: 0.3 }}
                    content={
                      <ChartTooltipContent
                        formatter={(value, _name, item) => {
                          const d = item.payload as (typeof chartData)[number];
                          return (
                            <div className="flex flex-col gap-0.5">
                              <span className="font-mono tabular-nums">{value}%</span>
                              <span className="text-xs text-muted-foreground">
                                R$ {formatMoney(d.raised)} / R$ {formatMoney(d.target)}
                              </span>
                            </div>
                          );
                        }}
                      />
                    }
                  />
                  <Bar dataKey="progress" fill="var(--color-progress)" radius={4} />
                </BarChart>
              </ChartContainer>
            </div>
          )}

          {fundsWithoutTarget.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="mb-2 text-sm font-medium text-muted-foreground">Sem meta</h4>
              <ul className="divide-y">
                {fundsWithoutTarget.map((f) => (
                  <li
                    key={f.fundId}
                    className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                    <span className="text-sm">{f.fundName}</span>
                    <span className="font-mono text-sm text-money-in">
                      R$ {formatMoney(f.totalRaised)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
