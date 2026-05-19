import { useState } from 'react';
import MonthInput from '@/components/MonthInput';
import { DashboardClosingBanner } from './DashboardClosingBanner';
import { AttenderStats } from './AttenderStats';
import { FundsChart } from './FundsChart';
import { getCurrentMonth } from './dashboard-utils';

export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-end gap-2">
        <label htmlFor="month-input" className="text-sm font-medium text-muted-foreground">
          Mês:
        </label>
        <MonthInput
          id="month-input"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.currentTarget.value)}
          className="w-40"
        />
      </div>

      {/* Closing Status Banner */}
      <DashboardClosingBanner />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Congregados</h2>
        <AttenderStats month={selectedMonth} />
      </div>

      {/* Funds Chart */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Fundos Designados (acumulado)</h2>
        <FundsChart />
      </div>
    </div>
  );
}
