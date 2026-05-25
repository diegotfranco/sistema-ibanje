import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/DataTable';
import { ProgressBar } from '@/components/ProgressBar';
import { Button } from '@/components/ui/button';
import { formatMoney } from '../entries-utils';
import { useFundsReport } from './useReports';
import type { FundSummary } from './schema';

interface Props {
  month: string;
}

type ViewMode = 'acumulado' | 'mes';

const acumuladoColumns: ColumnDef<FundSummary, unknown>[] = [
  {
    id: 'name',
    header: 'Campanha',
    cell: (info) => info.row.original.fundName,
    meta: { className: 'w-[28%]' }
  },
  {
    id: 'target',
    header: 'Meta',
    cell: (info) => {
      const t = info.row.original.targetAmount;
      return t ? (
        <span className="font-mono tabular-nums">R$ {formatMoney(t)}</span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      );
    },
    meta: { align: 'right', hideBelow: 'md' }
  },
  {
    id: 'raised',
    header: 'Arrecadado',
    cell: (info) => (
      <span className="font-mono tabular-nums text-money-in">
        R$ {formatMoney(info.row.original.totalRaised)}
      </span>
    ),
    meta: { align: 'right' }
  },
  {
    id: 'progress',
    header: 'Progresso',
    cell: (info) => {
      const row = info.row.original;
      if (!row.targetAmount) {
        return <span className="text-xs text-muted-foreground">sem meta</span>;
      }
      return (
        <div className="flex min-w-[120px] flex-col gap-1">
          <ProgressBar value={row.totalRaised} target={row.targetAmount} />
          <span className="text-xs text-muted-foreground">{row.progressPercentage ?? '0'}%</span>
        </div>
      );
    },
    meta: { hideBelow: 'sm' }
  },
  {
    id: 'balance',
    header: 'Saldo',
    cell: (info) => (
      <span className="font-mono tabular-nums">R$ {formatMoney(info.row.original.balance)}</span>
    ),
    meta: { align: 'right' }
  }
];

const mesColumns: ColumnDef<FundSummary, unknown>[] = [
  {
    id: 'name',
    header: 'Campanha',
    cell: (info) => info.row.original.fundName,
    meta: { className: 'w-full' }
  },
  {
    id: 'raised',
    header: 'Arrecadado',
    cell: (info) => (
      <span className="font-mono tabular-nums text-money-in">
        R$ {formatMoney(info.row.original.totalRaised)}
      </span>
    ),
    meta: { align: 'right' }
  },
  {
    id: 'spent',
    header: 'Gasto',
    cell: (info) => (
      <span className="font-mono tabular-nums text-money-out">
        R$ {formatMoney(info.row.original.totalExpenses)}
      </span>
    ),
    meta: { align: 'right', hideBelow: 'sm' }
  },
  {
    id: 'balance',
    header: 'Saldo',
    cell: (info) => {
      const balance = Number.parseFloat(info.row.original.balance);
      return (
        <span
          className={`font-mono tabular-nums font-medium ${
            balance >= 0 ? 'text-money-in' : 'text-money-out'
          }`}>
          R$ {formatMoney(info.row.original.balance)}
        </span>
      );
    },
    meta: { align: 'right' }
  }
];

export function CampaignsReportTab({ month }: Props) {
  const [view, setView] = useState<ViewMode>('acumulado');
  const { data, isLoading } = useFundsReport(view === 'mes' ? month : undefined);
  const funds = data?.funds ?? [];

  return (
    <div className="space-y-4 px-4 py-4 sm:px-6">
      <div role="radiogroup" className="inline-flex rounded-md border bg-background p-0.5">
        {[
          { mode: 'acumulado' as const, label: 'Acumulado' },
          { mode: 'mes' as const, label: 'Mês' }
        ].map(({ mode, label }) => (
          <Button
            key={mode}
            type="button"
            size="sm"
            variant={view === mode ? 'default' : 'ghost'}
            role="radio"
            aria-checked={view === mode}
            onClick={() => setView(mode)}>
            {label}
          </Button>
        ))}
      </div>

      <DataTable<FundSummary>
        columns={view === 'acumulado' ? acumuladoColumns : mesColumns}
        data={funds}
        isLoading={isLoading}
        getRowKey={(row) => row.fundId}
        mobileRow={(row) =>
          view === 'acumulado' ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 flex-1 font-medium truncate">{row.fundName}</p>
                <span className="shrink-0 font-mono text-sm text-money-in">
                  R$ {formatMoney(row.totalRaised)}
                </span>
              </div>
              {row.targetAmount ? (
                <>
                  <ProgressBar value={row.totalRaised} target={row.targetAmount} />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Meta R$ {formatMoney(row.targetAmount)}</span>
                    <span>{row.progressPercentage ?? '0'}%</span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">sem meta</p>
              )}
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{row.fundName}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="text-money-in">R$ {formatMoney(row.totalRaised)}</span>
                  {' − '}
                  <span className="text-money-out">R$ {formatMoney(row.totalExpenses)}</span>
                </p>
              </div>
              <span
                className={`shrink-0 font-mono text-sm ${
                  Number.parseFloat(row.balance) >= 0 ? 'text-money-in' : 'text-money-out'
                }`}>
                R$ {formatMoney(row.balance)}
              </span>
            </div>
          )
        }
      />
    </div>
  );
}
