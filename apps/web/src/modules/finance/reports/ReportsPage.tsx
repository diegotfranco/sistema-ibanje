import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MonthInput from '@/components/MonthInput';
import { Label } from '@/components/ui/label';
import { Module, Action } from '@/lib/permissions';
import { RequirePermission } from '@/components/RequirePermission';
import { IncomeReportTab } from './IncomeReportTab';
import { ExpenseReportTab } from './ExpenseReportTab';
import { StatementTab } from './StatementTab';

function defaultMonth() {
  const now = new Date();
  return now.toISOString().slice(0, 7);
}

const DEFAULT_MONTH = defaultMonth();

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'income';
  // Handle old ?tab=members-funds by falling back to default tab
  const validTab = ['income', 'expenses', 'statement'].includes(activeTab) ? activeTab : 'income';

  const [month, setMonth] = useState(DEFAULT_MONTH);

  return (
    <RequirePermission module={Module.Reports} action={Action.Report}>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Relatórios</h1>
        </div>

        <div className="flex items-end gap-4 flex-wrap">
          <div className="space-y-1">
            <Label htmlFor="reports-month">Mês</Label>
            <MonthInput
              id="reports-month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-40"
            />
          </div>
        </div>

        <Tabs value={validTab} onValueChange={(v) => setSearchParams({ tab: v })}>
          <TabsList>
            <TabsTrigger value="income">Entradas</TabsTrigger>
            <TabsTrigger value="expenses">Saídas</TabsTrigger>
            <TabsTrigger value="statement">Demonstrativo</TabsTrigger>
          </TabsList>

          <TabsContent value="income">
            <IncomeReportTab month={month} />
          </TabsContent>
          <TabsContent value="expenses">
            <ExpenseReportTab month={month} />
          </TabsContent>
          <TabsContent value="statement">
            <StatementTab month={month} />
          </TabsContent>
        </Tabs>
      </div>
    </RequirePermission>
  );
}
