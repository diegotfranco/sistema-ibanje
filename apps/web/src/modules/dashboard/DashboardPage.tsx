import { useState } from 'react';
import { PageContainer } from '@/components/PageContainer';
import { MonthPicker } from '@/components/MonthPicker';
import { RequirePermission } from '@/components/RequirePermission';
import { Module, Action } from '@/lib/permissions';
import { getCurrentMonth } from './dashboard-utils';
import { useDashboard } from './useDashboard';
import { FinanceKpiStrip } from './FinanceKpiStrip';
import { ClosingStatusCard } from './ClosingStatusCard';
import { TrendChart } from './TrendChart';
import { ParticipationCard } from './ParticipationCard';
import { ParticipationChart } from './ParticipationChart';
import { FundsAndEventsCard } from './FundsAndEventsCard';

export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const { data, isLoading } = useDashboard(selectedMonth);
  const isFutureMonth = selectedMonth > getCurrentMonth();

  return (
    <RequirePermission module={Module.Dashboard} action={Action.View}>
      <PageContainer>
        <div className="flex items-center justify-end gap-2">
          <MonthPicker
            id="month-input"
            value={selectedMonth}
            onChange={setSelectedMonth}
            className="w-48 hover:bg-muted-foreground/10"
          />
        </div>

        {!isFutureMonth && (
          <ClosingStatusCard data={data?.closing} month={selectedMonth} isLoading={isLoading} />
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 gap-4">
              <ParticipationCard
                title="Participação no Dízimo"
                data={data?.participation.tithe}
                isLoading={isLoading}
              />
              <ParticipationCard
                title="Participação na Oferta"
                data={data?.participation.offering}
                isLoading={isLoading}
              />
              <FinanceKpiStrip data={data?.finance} isLoading={isLoading} />
            </div>
          </div>
          <div className="lg:col-span-3">
            <TrendChart data={data?.trends.monthly} isLoading={isLoading} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <FundsAndEventsCard
            className="lg:col-span-2"
            events={data?.events}
            funds={data?.funds}
            isLoading={isLoading}
          />
          <ParticipationChart
            className="lg:col-span-3"
            data={data?.trends.monthly}
            isLoading={isLoading}
          />
        </div>
      </PageContainer>
    </RequirePermission>
  );
}
