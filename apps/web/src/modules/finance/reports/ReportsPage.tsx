import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { PageContainer } from '@/components/PageContainer';
import { Card, CardContent, CardHeaderRow, CardTitle } from '@/components/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MonthPicker } from '@/components/MonthPicker';
import { Module, Action } from '@/lib/permissions';
import { RequirePermission } from '@/components/RequirePermission';
import { IncomeReportTab } from './IncomeReportTab';
import { ExpenseReportTab } from './ExpenseReportTab';
import { StatementTab } from './StatementTab';
import { EventsReportTab } from './EventsReportTab';

function defaultMonth() {
  const now = new Date();
  return now.toISOString().slice(0, 7);
}

const DEFAULT_MONTH = defaultMonth();

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'income';
  const validTab = ['income', 'expenses', 'statement', 'events'].includes(activeTab)
    ? activeTab
    : 'income';

  const [month, setMonth] = useState(DEFAULT_MONTH);

  return (
    <RequirePermission module={Module.Reports} action={Action.Report}>
      <PageContainer>
        <Card className="gap-0 py-0">
          <CardHeaderRow className="border-b py-4">
            <CardTitle>Relatórios</CardTitle>
            <MonthPicker
              id="reports-month"
              value={month}
              onChange={setMonth}
              className="w-full sm:w-48"
            />
          </CardHeaderRow>
          <CardContent className="p-0">
            <Tabs
              className="relative"
              value={validTab}
              onValueChange={(v) => setSearchParams({ tab: v })}>
              <div className="overflow-x-auto border-b px-4 py-3">
                <TabsList>
                  <TabsTrigger value="income">Entradas</TabsTrigger>
                  <TabsTrigger value="expenses">Saídas</TabsTrigger>
                  <TabsTrigger value="statement">Demonstrativo</TabsTrigger>
                  <TabsTrigger value="events">Eventos</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="income">
                <IncomeReportTab month={month} />
              </TabsContent>
              <TabsContent value="expenses">
                <ExpenseReportTab month={month} />
              </TabsContent>
              <TabsContent value="statement">
                <StatementTab month={month} />
              </TabsContent>
              <TabsContent value="events">
                <EventsReportTab month={month} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </PageContainer>
    </RequirePermission>
  );
}
