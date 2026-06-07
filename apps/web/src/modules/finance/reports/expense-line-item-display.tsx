import type { ReactNode } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { type RowDetailField } from '@/components/RowDetailPanel';
import StatusBadge from '@/components/StatusBadge';
import { formatDate, formatMoney, ENTRY_STATUS_FILTER_OPTIONS } from '../entries-utils';
import { lineItemActionsColumn, type LineItemActions } from '../components/RowActions';

/**
 * Minimal expense shape the table cells, mobile row, and detail fields read.
 * Both `ExpenseReportRow` and the entries page's `ExpenseEntryResponse` (once
 * its `designatedFundName` is normalized to `fundName`) satisfy it, so the
 * report tab and the dashboard "latest" widget share one rendering.
 */
export interface ExpenseLineItem {
  id: number;
  date: string;
  parentCategoryName: string | null;
  categoryName: string;
  notes: string | null;
  fundName: string | null;
  attenderName: string | null;
  amount: string;
  paymentMethodName: string;
  installment: number;
  totalInstallments: number;
  hasReceipt: boolean;
  status: string;
}

function installmentLabel(row: ExpenseLineItem): string {
  return row.totalInstallments > 1 ? `${row.installment}/${row.totalInstallments}` : '—';
}

export function buildExpenseLineItemColumns<T extends ExpenseLineItem>(opts?: {
  statusFilter?: boolean;
  actions?: LineItemActions<T>;
}): ColumnDef<T, unknown>[] {
  const columns: ColumnDef<T, unknown>[] = [
    {
      id: 'date',
      header: 'Data',
      cell: (info) => <span className="tabular-nums">{formatDate(info.row.original.date)}</span>,
      meta: {}
    },
    {
      id: 'group',
      header: 'Grupo',
      cell: (info) => info.row.original.parentCategoryName ?? '—',
      meta: { hideBelow: 'xl' }
    },
    {
      id: 'category',
      header: 'Categoria',
      cell: (info) => info.row.original.categoryName,
      meta: { className: 'w-full' }
    },
    {
      id: 'notes',
      header: 'Observações',
      cell: (info) => (
        <span
          title={info.row.original.notes ?? undefined}
          className="block max-w-full truncate text-muted-foreground">
          {info.row.original.notes ?? '—'}
        </span>
      ),
      meta: { hideBelow: 'lg', className: 'max-w-64' }
    },
    {
      id: 'designatedFund',
      header: 'Campanha',
      cell: (info) => info.row.original.fundName ?? '—',
      meta: { hideBelow: '2xl' }
    },
    {
      id: 'sponsor',
      header: 'Patrocinador',
      cell: (info) => info.row.original.attenderName ?? '—',
      meta: { hideBelow: '2xl' }
    },
    {
      id: 'amount',
      header: 'Valor',
      cell: (info) => (
        <span className="font-mono tabular-nums">R$ {formatMoney(info.row.original.amount)}</span>
      ),
      meta: { align: 'right' }
    },
    {
      id: 'paymentMethod',
      header: 'Forma de Pag.',
      cell: (info) => info.row.original.paymentMethodName,
      meta: { hideBelow: 'xl' }
    },
    {
      id: 'installment',
      header: 'Parcela',
      cell: (info) => installmentLabel(info.row.original),
      meta: { hideBelow: '2xl', align: 'center' }
    },
    {
      id: 'status',
      header: 'Status',
      cell: (info) => <StatusBadge status={info.row.original.status} />,
      meta: {
        hideBelow: 'lg',
        ...(opts?.statusFilter ? { filter: { options: ENTRY_STATUS_FILTER_OPTIONS } } : {})
      }
    }
  ];

  const actionsColumn = opts?.actions ? lineItemActionsColumn(opts.actions) : null;
  if (actionsColumn) columns.push(actionsColumn);
  return columns;
}

export function renderExpenseLineItemMobile(row: ExpenseLineItem): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm tabular-nums text-muted-foreground">{formatDate(row.date)}</span>
        <span className="font-mono tabular-nums font-semibold">R$ {formatMoney(row.amount)}</span>
      </div>
      <div className="text-sm font-medium">{row.categoryName}</div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        {row.parentCategoryName && <span>{row.parentCategoryName}</span>}
        {row.parentCategoryName && <span aria-hidden>•</span>}
        <span>{row.paymentMethodName}</span>
        {row.totalInstallments > 1 && (
          <>
            <span aria-hidden>•</span>
            <span className="tabular-nums">
              {row.installment}/{row.totalInstallments}
            </span>
          </>
        )}
      </div>
      {row.notes && (
        <p className="text-xs text-muted-foreground line-clamp-1" title={row.notes}>
          {row.notes}
        </p>
      )}
      <div className="mt-1">
        <StatusBadge status={row.status} />
      </div>
    </div>
  );
}

export function buildExpenseLineItemFields(row: ExpenseLineItem): RowDetailField[] {
  return [
    { label: 'Data', value: formatDate(row.date) },
    { label: 'Grupo', value: row.parentCategoryName ?? '—', hideEmpty: true },
    { label: 'Categoria', value: row.categoryName },
    { label: 'Observações', value: row.notes ?? '—', hideEmpty: true },
    { label: 'Campanha', value: row.fundName ?? '—', hideEmpty: true },
    { label: 'Patrocinador', value: row.attenderName ?? '—', hideEmpty: true },
    {
      label: 'Valor',
      value: (
        <span className="font-mono tabular-nums font-semibold">R$ {formatMoney(row.amount)}</span>
      )
    },
    { label: 'Forma de Pag.', value: row.paymentMethodName },
    { label: 'Parcela', value: installmentLabel(row), hideEmpty: true },
    { label: 'Status', value: <StatusBadge status={row.status} /> },
    {
      label: 'Comprovante',
      value: row.hasReceipt ? (
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={`${import.meta.env.VITE_API_URL || '/api'}/expense-entries/${row.id}/receipt`}
          className="text-primary hover:text-primary-soft inline-flex">
          Ver
        </a>
      ) : (
        '—'
      ),
      hideEmpty: true
    }
  ];
}
