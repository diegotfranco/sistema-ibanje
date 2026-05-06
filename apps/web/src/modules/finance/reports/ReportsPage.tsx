import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DateInput from '@/components/DateInput';
import { Label } from '@/components/ui/label';
import { Module, Action } from '@/lib/permissions';
import { RequirePermission } from '@/components/RequirePermission';
import { IncomeReportTab } from './IncomeReportTab';
import { ExpenseReportTab } from './ExpenseReportTab';
import { StatementTab } from './StatementTab';
import { MembersFundsTab } from './MembersFundsTab';

function defaultDates() {
  const to = new Date().toISOString().split('T')[0];
  const d = new Date();
  d.setDate(d.getDate() - 30);
  const from = d.toISOString().split('T')[0];
  return { from, to };
}

const { from: defaultFrom, to: defaultTo } = defaultDates();

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'income';

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

  return (
    <RequirePermission module={Module.Reports} action={Action.Report}>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Relatórios</h1>
        </div>

        <div className="flex items-end gap-4 flex-wrap">
          <div className="space-y-1">
            <Label>De</Label>
            <DateInput value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
          </div>
          <div className="space-y-1">
            <Label>Até</Label>
            <DateInput value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v })}>
          <TabsList>
            <TabsTrigger value="income">Entradas</TabsTrigger>
            <TabsTrigger value="expenses">Saídas</TabsTrigger>
            <TabsTrigger value="statement">Demonstrativo</TabsTrigger>
            <TabsTrigger value="members-funds">Membros & Fundos</TabsTrigger>
          </TabsList>

          <TabsContent value="income">
            <IncomeReportTab from={from} to={to} />
          </TabsContent>
          <TabsContent value="expenses">
            <ExpenseReportTab from={from} to={to} />
          </TabsContent>
          <TabsContent value="statement">
            <StatementTab from={from} to={to} />
          </TabsContent>
          <TabsContent value="members-funds">
            <MembersFundsTab from={from} to={to} />
          </TabsContent>
        </Tabs>
      </div>
    </RequirePermission>
  );
}
