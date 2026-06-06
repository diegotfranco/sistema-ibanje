import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartCard } from '@/components/ChartCard';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import { formatMoney } from './dashboard-utils';
import { MoneyTooltipRow } from './chart-tooltip';
import type { MonthlyTrend } from '@sistema-ibanje/shared';

const chartConfig = {
  tithe: { label: 'Dízimo', color: 'var(--color-chart-1)' },
  offering: { label: 'Oferta', color: 'var(--color-chart-2)' },
  donation: { label: 'Doação', color: 'var(--color-chart-3)' }
} satisfies ChartConfig;

interface ParticipationChartProps {
  data: MonthlyTrend[] | undefined;
  isLoading?: boolean;
  className?: string;
}

type ChartVariation = 'valores' | 'quantidade' | 'ticket';

const monthAbbreviations: Record<number, string> = {
  1: 'Jan',
  2: 'Fev',
  3: 'Mar',
  4: 'Abr',
  5: 'Mai',
  6: 'Jun',
  7: 'Jul',
  8: 'Ago',
  9: 'Set',
  10: 'Out',
  11: 'Nov',
  12: 'Dez'
};

function getMonthAbbrev(monthStr: string): string {
  const [, month] = monthStr.split('-');
  const monthNum = Number.parseInt(month, 10);
  return monthAbbreviations[monthNum] || month;
}

export function ParticipationChart({ data, isLoading, className }: ParticipationChartProps) {
  const [variation, setVariation] = useState<ChartVariation>('valores');

  if (isLoading) {
    return (
      <ChartCard title="Contribuições por Categoria (12 meses)" className={className}>
        <Skeleton className="h-72 w-full" />
      </ChartCard>
    );
  }

  if (!data || data.length === 0) {
    return (
      <ChartCard title="Contribuições por Categoria (12 meses)" className={className}>
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Sem dados disponíveis</p>
        </div>
      </ChartCard>
    );
  }

  const chartData = data.map((entry) => {
    if (variation === 'valores') {
      return {
        month: getMonthAbbrev(entry.month),
        tithe: Number.parseFloat(entry.titheAmount),
        offering: Number.parseFloat(entry.offeringAmount),
        donation: Number.parseFloat(entry.donationAmount)
      };
    } else if (variation === 'quantidade') {
      return {
        month: getMonthAbbrev(entry.month),
        tithe: entry.titheCount,
        offering: entry.offeringCount,
        donation: entry.donationCount
      };
    } else {
      const titheTicket =
        entry.titheCount > 0 ? Number.parseFloat(entry.titheAmount) / entry.titheCount : 0;
      const offeringTicket =
        entry.offeringCount > 0 ? Number.parseFloat(entry.offeringAmount) / entry.offeringCount : 0;
      const donationTicket =
        entry.donationCount > 0 ? Number.parseFloat(entry.donationAmount) / entry.donationCount : 0;
      return {
        month: getMonthAbbrev(entry.month),
        tithe: titheTicket,
        offering: offeringTicket,
        donation: donationTicket
      };
    }
  });

  const yAxisFormatter =
    variation === 'quantidade'
      ? (value: number) => value.toFixed(0)
      : variation === 'ticket'
        ? (value: number) => {
            if (value >= 1_000) {
              return `R$${(value / 1_000).toFixed(0)}K`;
            }
            return `R$${value.toFixed(0)}`;
          }
        : (value: number) => {
            if (value >= 1_000_000) {
              return `R$${(value / 1_000_000).toFixed(0)}M`;
            }
            if (value >= 1_000) {
              return `R$${(value / 1_000).toFixed(0)}K`;
            }
            return `R$${value.toFixed(0)}`;
          };

  const variationSelect = (
    <Select value={variation} onValueChange={(v) => setVariation(v as ChartVariation)}>
      <SelectTrigger className="w-auto" aria-label="Tipo de variação do gráfico">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="valores">Valor total (R$)</SelectItem>
        <SelectItem value="quantidade">Número de contribuições</SelectItem>
        <SelectItem value="ticket">Valor médio (R$)</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <ChartCard
      title="Contribuições por Categoria (12 meses)"
      action={variationSelect}
      className={className}>
      <ChartContainer config={chartConfig} className="h-72 w-full aspect-auto">
        <BarChart data={chartData} margin={{ left: 0, right: 0, top: 16, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} tickFormatter={yAxisFormatter} />
          <ChartTooltip
            cursor={{ fill: 'var(--muted)', opacity: 0.3 }}
            content={
              <ChartTooltipContent
                formatter={(value, name, item) => (
                  <MoneyTooltipRow
                    color={item.color ?? ''}
                    label={chartConfig[name as keyof typeof chartConfig]?.label ?? name}
                    value={variation === 'quantidade' ? String(value) : formatMoney(String(value))}
                  />
                )}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="tithe" fill="var(--color-tithe)" stackId="a" />
          <Bar dataKey="offering" fill="var(--color-offering)" stackId="a" />
          <Bar dataKey="donation" fill="var(--color-donation)" radius={[4, 4, 0, 0]} stackId="a" />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}
