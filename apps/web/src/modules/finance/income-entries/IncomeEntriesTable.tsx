import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeaderRow, CardTitle } from '@/components/Card';
import { DataTable } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { RowDetailPanel } from '@/components/RowDetailPanel';
import { lineItemActionsColumn, RowDetailFooterActions } from '../components/RowActions';
import {
  renderIncomeLineItemMobile,
  buildIncomeLineItemFields
} from '../reports/income-line-item-display';
import { formatDate, formatMoney } from '../entries-utils';
import type { IncomeEntryResponse } from './schema';
import type { ColumnDef } from '@tanstack/react-table';

const LATEST_LIMIT = 15;

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

  // This dashboard "latest" widget hides columns more aggressively than the
  // report tab, so the column list stays local; only the action cell, mobile
  // row, and detail fields are shared with income-line-item-display.
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
      id: 'campaign',
      header: 'Campanha',
      cell: (info) => info.row.original.campaignName ?? '—',
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
    }
  ];

  const actionsColumn = lineItemActionsColumn<IncomeEntryResponse>({
    onView: setDetail,
    onEdit: canEdit ? onEdit : undefined,
    onDelete: canDelete ? onDelete : undefined
  });
  if (actionsColumn) columns.push(actionsColumn);

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
            mobileRow={renderIncomeLineItemMobile}
            mobileOnRowClick={setDetail}
            columnToggle
            tableId="income-entries"
          />
        </CardContent>
      </Card>
      <RowDetailPanel
        open={detail !== null}
        onOpenChange={(open) => !open && setDetail(null)}
        title="Detalhes do lançamento"
        fields={
          detail ? buildIncomeLineItemFields({ ...detail, campaignName: detail.campaignName }) : []
        }
        actions={
          detail ? (
            <RowDetailFooterActions
              onEdit={
                canEdit
                  ? () => {
                      const row = detail;
                      setDetail(null);
                      onEdit(row);
                    }
                  : undefined
              }
              onDelete={
                canDelete
                  ? () => {
                      const row = detail;
                      setDetail(null);
                      onDelete(row);
                    }
                  : undefined
              }
            />
          ) : undefined
        }
      />
    </>
  );
}
