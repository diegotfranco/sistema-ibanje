import { useState } from 'react';
import MonthInput from '@/components/MonthInput';
import { DashboardClosingBanner } from './DashboardClosingBanner';
import { MemberStats } from './MemberStats';
import { FundsChart } from './FundsChart';
import { getCurrentMonth } from './dashboard-utils';

export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Painel</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="month-input" className="text-sm font-medium text-slate-600">Mês:</label>
          <MonthInput
            id="month-input"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.currentTarget.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Closing Status Banner */}
      <DashboardClosingBanner />

      {/* Member Stats */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Membros</h2>
        <MemberStats month={selectedMonth} />
      </div>

      {/* Funds Chart */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Fundos Designados (acumulado)</h2>
        <FundsChart />
      </div>
    </div>
  );
}
