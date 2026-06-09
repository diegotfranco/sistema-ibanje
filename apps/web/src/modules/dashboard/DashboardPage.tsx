import { useState } from 'react';
import { PageContainer } from '@/components/PageContainer';
import { Card, CardContent } from '@/components/Card';
import { MonthPicker } from '@/components/MonthPicker';
import { RequirePermission } from '@/components/RequirePermission';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { getCurrentMonth } from './dashboard-utils';
import { useDashboard } from './useDashboard';
import { FinanceKpiStrip } from './FinanceKpiStrip';
import { ClosingStatusCard } from './ClosingStatusCard';
import { TrendChart } from './TrendChart';
import { ParticipationCard } from './ParticipationCard';
import { ParticipationChart } from './ParticipationChart';
import { CampaignsAndEventsCard } from './CampaignsAndEventsCard';
import { DashboardCalendarCard } from './DashboardCalendarCard';

export default function DashboardPage() {
  const { data: user } = useCurrentUser();
  const perms = user?.permissions;
  // The dashboard is a view layer: each section inherits the read permission of the module that
  // owns its data. The backend mirrors this and returns null sections for what the caller can't see.
  const canFinance = hasPermission(perms, Module.Reports, Action.Report);
  const canClosing = hasPermission(perms, Module.MonthlyClosings, Action.View);
  const canCalendar = hasPermission(perms, Module.SecretaryCalendar, Action.View);

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const { data, isLoading } = useDashboard(selectedMonth);
  const isFutureMonth = selectedMonth > getCurrentMonth();

  const hasAnySection = canFinance || canClosing || canCalendar;

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

        {canClosing && !isFutureMonth && (
          <ClosingStatusCard
            data={data?.closing ?? undefined}
            month={selectedMonth}
            isLoading={isLoading}
          />
        )}

        {canFinance && (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <div className="grid grid-cols-2 gap-4">
                  <ParticipationCard
                    title="Participação no Dízimo"
                    data={data?.participation?.tithe}
                    isLoading={isLoading}
                  />
                  <ParticipationCard
                    title="Participação na Oferta"
                    data={data?.participation?.offering}
                    isLoading={isLoading}
                  />
                  <FinanceKpiStrip data={data?.finance ?? undefined} isLoading={isLoading} />
                </div>
              </div>
              <div className="lg:col-span-3">
                <TrendChart data={data?.trends?.monthly} isLoading={isLoading} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
              <CampaignsAndEventsCard
                className="lg:col-span-2"
                events={data?.events ?? undefined}
                campaigns={data?.campaigns ?? undefined}
                isLoading={isLoading}
              />
              <ParticipationChart
                className="lg:col-span-3"
                data={data?.trends?.monthly}
                isLoading={isLoading}
              />
            </div>
          </>
        )}

        {canCalendar && <DashboardCalendarCard />}

        {!hasAnySection && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Nenhuma informação disponível para o seu perfil.
            </CardContent>
          </Card>
        )}
      </PageContainer>
    </RequirePermission>
  );
}
