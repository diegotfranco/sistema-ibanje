import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartCard } from '@/components/ChartCard';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  type ChartConfig
} from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import { formatMoney } from './dashboard-utils';
import { MoneyTooltipRow } from './chart-tooltip';
import type { Events, FundSummary } from '@sistema-ibanje/shared';

type CardView = 'funds' | 'events';

const eventsChartConfig = {
  raised: { label: 'Arrecadado', color: 'var(--color-chart-1)' },
  spent: { label: 'Investido', color: 'var(--color-chart-2)' }
} satisfies ChartConfig;

interface FundsAndEventsCardProps {
  funds: FundSummary[] | undefined;
  events: Events | undefined;
  isLoading?: boolean;
  className?: string;
}

function FundsContent({ data }: { data: FundSummary[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Nenhuma campanha ativa</p>
      </div>
    );
  }

  const rows = data.map((f) => {
    const raised = Number.parseFloat(f.totalRaised);
    const target = f.targetAmount ? Number.parseFloat(f.targetAmount) : null;
    const raisedPct =
      target !== null && target > 0 ? Math.min((raised / target) * 100, 100) : raised > 0 ? 100 : 0;
    return {
      name: f.fundName,
      raised,
      target,
      raisedPct,
      progressLabel: target !== null && target > 0 ? `${raisedPct.toFixed(1)}%` : 'Sem meta',
      amountLabel:
        target !== null
          ? `${formatMoney(f.totalRaised)} / ${formatMoney(target.toFixed(2))}`
          : formatMoney(f.totalRaised)
    };
  });

  return (
    <ul className="space-y-4">
      {rows.map((fund, idx) => (
        <li key={idx} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-medium text-foreground">{fund.name}</span>
            <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
              {fund.amountLabel}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 overflow-hidden rounded-full bg-muted/40">
              <div
                className="h-full transition-all"
                style={{ width: `${fund.raisedPct}%`, backgroundColor: 'var(--color-chart-3)' }}
              />
            </div>
            <span className="w-16 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
              {fund.progressLabel}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function EventsContent({ data }: { data: Events }) {
  if (data.recent.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Nenhum evento concluído neste período</p>
      </div>
    );
  }

  const chartData = data.recent.map((event) => ({
    eventTitle: event.eventTitle,
    raised: Number.parseFloat(event.totalRaised),
    spent: Number.parseFloat(event.totalSpent),
    net: Number.parseFloat(event.totalRaised) - Number.parseFloat(event.totalSpent)
  }));

  const summary = data.summary;
  const summaryNet = Number.parseFloat(summary.totalNet);
  const netColor = summaryNet >= 0 ? 'text-money-in' : 'text-money-out';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span>
          {summary.count} evento{summary.count !== 1 ? 's' : ''}
        </span>
        <span>·</span>
        <span>Arrecadado {formatMoney(summary.totalRaised)}</span>
        <span>·</span>
        <span>Investido {formatMoney(summary.totalSpent)}</span>
        <span>·</span>
        <span className={`font-semibold ${netColor}`}>
          Resultado {formatMoney(summary.totalNet)}
        </span>
      </div>

      <ChartContainer config={eventsChartConfig} className="h-72 w-full aspect-auto">
        <BarChart data={chartData} margin={{ left: 0, right: 0, top: 16, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="eventTitle"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11 }}
            interval={0}
            tickFormatter={(value: string) =>
              value.length > 12 ? `${value.slice(0, 11)}…` : value
            }
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => {
              const abs = Math.abs(value);
              if (abs >= 1_000_000) return `R$${(value / 1_000_000).toFixed(0)}M`;
              if (abs >= 1_000) return `R$${(value / 1_000).toFixed(0)}K`;
              return `R$${value.toFixed(0)}`;
            }}
          />
          <ChartTooltip
            cursor={{ fill: 'var(--muted)', opacity: 0.3 }}
            content={({ payload, active }) => {
              if (!active || !payload?.length) return null;
              const entry = payload[0]?.payload as (typeof chartData)[0];
              const netFill = entry.net >= 0 ? 'var(--color-chart-1)' : 'var(--color-chart-5)';
              return (
                <div className="grid min-w-32 items-start gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs shadow-xl">
                  <p className="font-medium text-foreground">{entry.eventTitle}</p>
                  <div className="flex items-center gap-1.5">
                    <MoneyTooltipRow
                      color="var(--color-chart-1)"
                      label="Arrecadado"
                      value={formatMoney(entry.raised)}
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MoneyTooltipRow
                      color="var(--color-chart-2)"
                      label="Investido"
                      value={formatMoney(entry.spent)}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 border-t border-border pt-1">
                    <MoneyTooltipRow
                      color={netFill}
                      label="Resultado"
                      value={formatMoney(entry.net)}
                    />
                  </div>
                </div>
              );
            }}
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="raised" fill="var(--color-raised)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="spent" fill="var(--color-spent)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

export function FundsAndEventsCard({
  events,
  funds,
  isLoading,
  className
}: FundsAndEventsCardProps) {
  const [view, setView] = useState<CardView>('funds');

  const viewSelect = (
    <Select value={view} onValueChange={(v) => setView(v as CardView)}>
      <SelectTrigger className="w-auto" aria-label="Alternar entre campanhas e eventos">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="funds">Campanhas ativas</SelectItem>
        <SelectItem value="events">Eventos recentes</SelectItem>
      </SelectContent>
    </Select>
  );

  if (isLoading) {
    return (
      <ChartCard title="Campanhas ativas" action={viewSelect} className={className}>
        <Skeleton className="h-72 w-full" />
      </ChartCard>
    );
  }

  const title = view === 'funds' ? 'Campanhas ativas' : 'Resultado por Evento';

  return (
    <ChartCard title={title} action={viewSelect} className={className}>
      {view === 'funds' ? (
        <FundsContent data={funds ?? []} />
      ) : (
        <EventsContent
          data={
            events ?? {
              recent: [],
              summary: { count: 0, totalRaised: '0.00', totalSpent: '0.00', totalNet: '0.00' }
            }
          }
        />
      )}
    </ChartCard>
  );
}
