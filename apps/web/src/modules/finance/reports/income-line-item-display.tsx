import type { ReactNode } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Edit, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { type RowDetailField } from '@/components/RowDetailPanel';
import StatusBadge from '@/components/StatusBadge';
import { formatDate, formatMoney, ENTRY_STATUS_FILTER_OPTIONS } from '../entries-utils';
import type { IncomeReportRow } from './schema';

export interface IncomeRowActions {
  canEdit: boolean;
  canDelete: boolean;
  onView?: (row: IncomeReportRow) => void;
  onEdit: (id: number) => void;
  onDelete: (row: IncomeReportRow) => void;
}

const baseColumns: ColumnDef<IncomeReportRow, unknown>[] = [
  {
    id: 'depositDate',
    header: 'Data Dep.',
    cell: (info) => (
      <span className="tabular-nums">{formatDate(info.row.original.depositDate)}</span>
    ),
    meta: { hideBelow: 'md' }
  },
  {
    id: 'referenceDate',
    header: 'Data Ref.',
    cell: (info) => (
      <span className="tabular-nums">{formatDate(info.row.original.referenceDate)}</span>
    ),
    meta: { hideBelow: 'md' }
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
    id: 'attender',
    header: 'Congregado',
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
    meta: { hideBelow: '2xl' }
  },
  {
    id: 'status',
    header: 'Status',
    cell: (info) => <StatusBadge status={info.row.original.status} />,
    meta: { hideBelow: 'lg', filter: { options: ENTRY_STATUS_FILTER_OPTIONS } }
  }
];

export function buildIncomeLineItemColumns(
  rowActions?: IncomeRowActions
): ColumnDef<IncomeReportRow, unknown>[] {
  if (!rowActions) return baseColumns;
  const { canEdit, canDelete, onView, onEdit, onDelete } = rowActions;
  return [
    ...baseColumns,
    {
      id: 'actions',
      header: 'Ações',
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="flex justify-end gap-2">
            {onView && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(row)}
                title="Ver detalhes"
                aria-label="Ver detalhes">
                <Eye size={16} />
              </Button>
            )}
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(row.id)}
                title="Editar"
                aria-label="Editar">
                <Edit size={16} />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(row)}
                title="Remover"
                aria-label="Remover">
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        );
      },
      meta: { align: 'right', canHide: false }
    }
  ];
}

export const incomeLineItemColumns = baseColumns;

export function renderIncomeLineItemMobile(row: IncomeReportRow): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm tabular-nums text-muted-foreground">
          {formatDate(row.depositDate)} - {formatDate(row.referenceDate)}
        </span>
        <span className="font-mono tabular-nums font-semibold">R$ {formatMoney(row.amount)}</span>
      </div>
      <div className="text-sm font-medium">{row.categoryName}</div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        {row.parentCategoryName && <span>{row.parentCategoryName}</span>}
        {row.parentCategoryName && <span aria-hidden>•</span>}
        <span>{row.paymentMethodName}</span>
        {row.attenderName && (
          <>
            <span aria-hidden>•</span>
            <span>{row.attenderName}</span>
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

export function buildIncomeLineItemFields(row: IncomeReportRow): RowDetailField[] {
  return [
    { label: 'Data Dep.', value: formatDate(row.depositDate) },
    { label: 'Data Ref.', value: formatDate(row.referenceDate) },
    { label: 'Grupo', value: row.parentCategoryName ?? '—', hideEmpty: true },
    { label: 'Categoria', value: row.categoryName },
    { label: 'Observações', value: row.notes ?? '—', hideEmpty: true },
    { label: 'Campanha', value: row.fundName ?? '—', hideEmpty: true },
    { label: 'Congregado', value: row.attenderName ?? '—', hideEmpty: true },
    {
      label: 'Valor',
      value: (
        <span className="font-mono tabular-nums font-semibold">R$ {formatMoney(row.amount)}</span>
      )
    },
    { label: 'Forma de Pag.', value: row.paymentMethodName },
    { label: 'Status', value: <StatusBadge status={row.status} /> }
  ];
}
