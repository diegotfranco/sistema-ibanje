import { useState } from 'react';
import { Bar, BarChart, Cell, XAxis, YAxis } from 'recharts';
import { useEventsReport } from '@/modules/finance/reports/useReports';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart';
import { formatMoney } from './dashboard-utils';
import type { EventSummary } from '@/modules/finance/reports/schema';

const RECENT_LIMIT = 5;

const chartConfig = {
  value: { label: 'Valor' }
} satisfies ChartConfig;

const BAR_COLORS = ['var(--color-money-out)', 'var(--color-money-in)'];

function formatRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) =>
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' });
  return s.toDateString() === e.toDateString() ? fmt(s) : `${fmt(s)} – ${fmt(e)}`;
}

function EventRow({ event }: { event: EventSummary }) {
  const spent = Number.parseFloat(event.totalSpent);
  const raised = Number.parseFloat(event.totalRaised);
  const net = Number.parseFloat(event.net);
  const data = [
    { metric: 'Investido', value: spent },
    { metric: 'Arrecadado', value: raised }
  ];
  const max = Math.max(spent, raised, 1);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{event.eventTitle}</p>
          <p className="text-xs text-muted-foreground">
            {formatRange(event.startTime, event.endTime)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Líquido</p>
          <p
            className={`font-mono font-semibold tabular-nums ${
              net >= 0 ? 'text-money-in' : 'text-money-out'
            }`}>
            R$ {formatMoney(event.net)}
          </p>
        </div>
      </div>
      <ChartContainer config={chartConfig} className="h-24 w-full">
        <BarChart
          accessibilityLayer
          data={data}
          layout="vertical"
          margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
          <XAxis type="number" hide domain={[0, max]} />
          <YAxis
            type="category"
            dataKey="metric"
            tickLine={false}
            axisLine={false}
            width={88}
            tick={{ fontSize: 12 }}
          />
          <ChartTooltip
            cursor={{ fill: 'var(--muted)', opacity: 0.3 }}
            content={
              <ChartTooltipContent
                formatter={(value) => (
                  <span className="font-mono tabular-nums">R$ {formatMoney(String(value))}</span>
                )}
              />
            }
          />
          <Bar dataKey="value" radius={4}>
            {data.map((_, i) => (
              <Cell key={i} fill={BAR_COLORS[i]} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}

export function EventsChart() {
  const { data, isLoading } = useEventsReport();
  const [now] = useState(() => Date.now());

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  const concluded = (data?.events ?? [])
    .filter((e) => new Date(e.endTime).getTime() < now)
    .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())
    .slice(0, RECENT_LIMIT);

  if (concluded.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
        <p className="text-sm text-muted-foreground">Nenhum evento concluído</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {concluded.map((event) => (
        <EventRow key={event.eventId} event={event} />
      ))}
    </div>
  );
}
