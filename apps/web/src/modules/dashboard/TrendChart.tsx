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
import { formatMoney } from './dashboard-utils';
import { MoneyTooltipRow } from './chart-tooltip';
import type { MonthlyTrend } from '@sistema-ibanje/shared';

const chartConfig = {
  income: { label: 'Receitas', color: 'var(--color-chart-1)' },
  expenses: { label: 'Despesas', color: 'var(--color-chart-2)' }
} satisfies ChartConfig;

interface TrendChartProps {
  data: MonthlyTrend[] | undefined;
  isLoading?: boolean;
}

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

export function TrendChart({ data, isLoading }: TrendChartProps) {
  if (isLoading) {
    return (
      <ChartCard title="Receitas e Despesas (12 meses)">
        <Skeleton className="h-80 w-full" />
      </ChartCard>
    );
  }

  if (!data || data.length === 0) {
    return (
      <ChartCard title="Receitas e Despesas (12 meses)">
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Sem dados disponíveis</p>
        </div>
      </ChartCard>
    );
  }

  const chartData = data.map((entry) => ({
    month: getMonthAbbrev(entry.month),
    income: Number.parseFloat(entry.income),
    expenses: Number.parseFloat(entry.expenses)
  }));

  return (
    <ChartCard title="Receitas e Despesas (12 meses)">
      <ChartContainer config={chartConfig} className="h-80 w-full aspect-auto">
        <BarChart data={chartData} margin={{ left: 0, right: 0, top: 16, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              if (value >= 1_000_000) {
                return `R$${(value / 1_000_000).toFixed(0)}M`;
              }
              if (value >= 1_000) {
                return `R$${(value / 1_000).toFixed(0)}K`;
              }
              return `R$${value.toFixed(0)}`;
            }}
          />
          <ChartTooltip
            cursor={{ fill: 'var(--muted)', opacity: 0.3 }}
            content={
              <ChartTooltipContent
                formatter={(value, name, item) => (
                  <MoneyTooltipRow
                    color={item.color ?? ''}
                    label={chartConfig[name as keyof typeof chartConfig]?.label ?? name}
                    value={formatMoney(String(value))}
                  />
                )}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}
