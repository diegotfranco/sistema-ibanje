import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/DataTable';
import { formatMoney } from '../entries-utils';
import { useEventsReport } from './useReports';
import type { EventSummary } from './schema';

interface Props {
  month: string;
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sameDay =
    s.getFullYear() === e.getFullYear() &&
    s.getMonth() === e.getMonth() &&
    s.getDate() === e.getDate();
  const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  return sameDay ? fmt(s) : `${fmt(s)} – ${fmt(e)}`;
}

const columns: ColumnDef<EventSummary, unknown>[] = [
  {
    id: 'title',
    header: 'Evento',
    cell: (info) => info.row.original.eventTitle,
    meta: { className: 'w-full' }
  },
  {
    id: 'when',
    header: 'Quando',
    cell: (info) => formatDateRange(info.row.original.startTime, info.row.original.endTime),
    meta: { hideBelow: 'md' }
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
        R$ {formatMoney(info.row.original.totalSpent)}
      </span>
    ),
    meta: { align: 'right', hideBelow: 'sm' }
  },
  {
    id: 'net',
    header: 'Saldo',
    cell: (info) => {
      const net = Number.parseFloat(info.row.original.net);
      return (
        <span
          className={`font-mono tabular-nums font-medium ${
            net >= 0 ? 'text-money-in' : 'text-money-out'
          }`}>
          R$ {formatMoney(info.row.original.net)}
        </span>
      );
    },
    meta: { align: 'right' }
  }
];

export function EventsReportTab({ month }: Props) {
  const { data, isLoading } = useEventsReport(month);
  const events = data?.events ?? [];

  return (
    <div className="px-4 py-4 sm:px-6">
      <DataTable<EventSummary>
        columns={columns}
        data={events}
        isLoading={isLoading}
        getRowKey={(row) => row.eventId}
        mobileRow={(row) => (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{row.eventTitle}</p>
              <p className="text-xs text-muted-foreground">
                {formatDateRange(row.startTime, row.endTime)}
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="text-money-in">R$ {formatMoney(row.totalRaised)}</span>
                {' − '}
                <span className="text-money-out">R$ {formatMoney(row.totalSpent)}</span>
              </p>
            </div>
            <span
              className={`shrink-0 font-mono text-sm ${
                Number.parseFloat(row.net) >= 0 ? 'text-money-in' : 'text-money-out'
              }`}>
              R$ {formatMoney(row.net)}
            </span>
          </div>
        )}
      />
    </div>
  );
}
