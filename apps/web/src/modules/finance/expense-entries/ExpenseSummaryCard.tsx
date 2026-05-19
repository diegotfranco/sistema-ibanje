import { Wallet } from 'lucide-react';
import { formatMoney } from '../entries-utils';
import { useExpenseSummary } from './useExpenseSummary';

const MONTHS_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

const BUDGET_OK_MAX = 0.6;
const BUDGET_WARN_MAX = 0.85;
const BUDGET_DANGER_MAX = 1.0;

function currentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const pad = (n: number) => String(n).padStart(2, '0');
  const from = `${year}-${pad(month + 1)}-01`;
  const to = `${year}-${pad(month + 1)}-${pad(now.getDate())}`;
  return { from, to, label: `${MONTHS_PT[month]}/${year}` };
}

function pickBarColor(ratio: number): string {
  if (ratio > BUDGET_DANGER_MAX) return 'bg-rose-500';
  if (ratio > BUDGET_WARN_MAX) return 'bg-orange-500';
  if (ratio > BUDGET_OK_MAX) return 'bg-amber-400';
  return 'bg-emerald-400';
}

export function ExpenseSummaryCard() {
  const { from, to, label } = currentMonthRange();
  const { data, isLoading } = useExpenseSummary(from, to);

  const totalExpense = Number.parseFloat(data?.total ?? '0');
  const totalIncome = Number.parseFloat(data?.totalIncome ?? '0');
  const ratio = totalIncome > 0 ? totalExpense / totalIncome : null;
  const barWidth = ratio === null ? 0 : Math.min(100, ratio * 100);
  const barColor = ratio === null ? 'bg-white/30' : pickBarColor(ratio);
  const overBudget = ratio !== null && ratio > 1;

  return (
    <div className="bg-primary text-primary-foreground rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/15 rounded-md p-2">
            <Wallet size={20} />
          </div>
          <div>
            <p className="text-sm opacity-90">Total do mês</p>
            <p className="text-xs opacity-75">{label}</p>
          </div>
        </div>
        <div className="text-right text-sm">
          <p className="opacity-75">Entradas</p>
          <p className="font-mono tabular-nums">R$ {formatMoney(data?.totalIncome ?? '0')}</p>
        </div>
      </div>

      <div className="mt-3">
        {isLoading ? (
          <div className="h-7 w-48 animate-pulse rounded bg-white/20" />
        ) : (
          <p className="text-2xl font-semibold font-mono tabular-nums">
            R$ {formatMoney(data?.total ?? '0')}
          </p>
        )}
        {ratio === null && !isLoading && (
          <p className="mt-1 text-xs opacity-75">Sem entradas no mês</p>
        )}
      </div>

      <div className="mt-3">
        <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
          <div
            className={`h-full rounded-full transition-[width,background-color] ${barColor}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-end text-xs">
          {ratio === null ? (
            <span className="opacity-75">—</span>
          ) : (
            <span
              className={`font-mono tabular-nums ${overBudget ? 'text-rose-200 font-semibold' : ''}`}>
              {Math.round(ratio * 100)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
