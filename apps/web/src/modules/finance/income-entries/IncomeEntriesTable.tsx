import { useState } from 'react';
import { Link } from 'react-router';
import { Edit, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeaderRow, CardTitle } from '@/components/Card';
import { DataTable } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { MobileRowDetailSheet, type RowDetailField } from '@/components/MobileRowDetailSheet';
import { formatDate, formatMoney } from '../entries-utils';
import type { IncomeEntryResponse } from './schema';
import type { ColumnDef } from '@tanstack/react-table';

const LATEST_LIMIT = 10;

interface Props {
  data: IncomeEntryResponse[];
  isLoading: boolean;
  onEdit: (row: IncomeEntryResponse) => void;
  onDelete: (row: IncomeEntryResponse) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function IncomeEntriesTable({
  data,
  isLoading,
  onEdit,
  onDelete,
  canEdit,
  canDelete
}: Props) {
  const latest = [...data]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, LATEST_LIMIT);

  const [detail, setDetail] = useState<IncomeEntryResponse | null>(null);

  const columns: ColumnDef<IncomeEntryResponse, unknown>[] = [
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
      meta: {}
    },
    {
      id: 'group',
      header: 'Grupo',
      cell: (info) => info.row.original.parentCategoryName ?? '—',
      meta: { hideBelow: 'lg' }
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
      meta: { hideBelow: 'md', className: 'max-w-64' }
    },
    {
      id: 'designatedFund',
      header: 'Campanha',
      cell: (info) => info.row.original.designatedFundName ?? '—',
      meta: { hideBelow: 'xl' }
    },
    {
      id: 'attender',
      header: 'Congregado',
      cell: (info) => info.row.original.attenderName ?? '—',
      meta: { hideBelow: 'xl' }
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
      meta: { hideBelow: 'lg' }
    },
    {
      id: 'status',
      header: 'Status',
      cell: (info) => <StatusBadge status={info.row.original.status} />,
      meta: { hideBelow: 'md' }
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="flex justify-end gap-2">
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(row)}
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
      meta: { align: 'right' }
    }
  ];

  const renderMobileRow = (row: IncomeEntryResponse) => (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <span className="text-sm tabular-nums text-muted-foreground">
            {formatDate(row.depositDate)} - {formatDate(row.referenceDate)}
          </span>
        </div>
        <span className="font-mono tabular-nums font-semibold text-money-in">
          R$ {formatMoney(row.amount)}
        </span>
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

  const buildDetailFields = (row: IncomeEntryResponse): RowDetailField[] => [
    { label: 'Data Dep.', value: formatDate(row.depositDate) },
    { label: 'Data Ref.', value: formatDate(row.referenceDate) },
    { label: 'Grupo', value: row.parentCategoryName ?? '—', hideEmpty: true },
    { label: 'Categoria', value: row.categoryName },
    { label: 'Observações', value: row.notes ?? '—', hideEmpty: true },
    { label: 'Campanha', value: row.designatedFundName ?? '—', hideEmpty: true },
    { label: 'Congregado', value: row.attenderName ?? '—', hideEmpty: true },
    {
      label: 'Valor',
      value: (
        <span className="font-mono tabular-nums font-semibold text-money-in">
          R$ {formatMoney(row.amount)}
        </span>
      )
    },
    { label: 'Forma de Pag.', value: row.paymentMethodName },
    { label: 'Status', value: <StatusBadge status={row.status} /> }
  ];

  return (
    <>
      <Card className="pb-0">
        <CardHeaderRow>
          <CardTitle className="text-primary-soft">Últimos lançamentos</CardTitle>
          <Button
            asChild
            variant="link"
            size="sm"
            className="text-muted-foreground hover:text-primary-soft">
            <Link to="/reports?tab=income" className="inline-flex items-center gap-1">
              Ver todos
              <ArrowRight size={14} />
            </Link>
          </Button>
        </CardHeaderRow>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={latest}
            isLoading={isLoading}
            emptyMessage="Nenhum lançamento ainda."
            getRowKey={(row) => row.id}
            mobileRow={renderMobileRow}
            mobileOnRowClick={setDetail}
          />
        </CardContent>
      </Card>
      <MobileRowDetailSheet
        open={detail !== null}
        onOpenChange={(open) => !open && setDetail(null)}
        title="Detalhes do lançamento"
        fields={detail ? buildDetailFields(detail) : []}
        actions={
          detail && (canEdit || canDelete) ? (
            <div className="flex justify-end gap-2">
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const row = detail;
                    setDetail(null);
                    onEdit(row);
                  }}>
                  <Edit size={16} className="mr-1" />
                  Editar
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const row = detail;
                    setDetail(null);
                    onDelete(row);
                  }}>
                  <Trash2 size={16} className="mr-1" />
                  Remover
                </Button>
              )}
            </div>
          ) : undefined
        }
      />
    </>
  );
}
