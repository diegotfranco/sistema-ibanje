import { useMemo, useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { DataTable } from '@/components/DataTable';
import { Pagination } from '@/components/Pagination';
import { RowDetailPanel } from '@/components/RowDetailPanel';
import { formatMoney } from '../entries-utils';
import { useIncomeReport } from './useReports';
import {
  buildIncomeLineItemColumns,
  renderIncomeLineItemMobile,
  buildIncomeLineItemFields,
  type IncomeRowActions
} from './income-line-item-display';
import type { IncomeReportRow } from './schema';

interface Props {
  month: string;
  mode?: 'full' | 'embedded';
  rowActions?: Omit<IncomeRowActions, 'onView'>;
}

export function IncomeReportTab({ month, mode = 'full', rowActions }: Props) {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const [detail, setDetail] = useState<IncomeReportRow | null>(null);
  const limit = mode === 'embedded' ? 15 : 30;
  const { data, isLoading } = useIncomeReport(month, page, limit, filters);

  const rows = data?.data ?? [];
  const isEmbedded = mode === 'embedded';

  const columns = useMemo(
    () =>
      buildIncomeLineItemColumns(
        rowActions
          ? {
              ...rowActions,
              onView: setDetail
            }
          : undefined
      ),
    [rowActions]
  );

  const canEdit = rowActions?.canEdit ?? false;
  const canDelete = rowActions?.canDelete ?? false;

  return (
    <>
      {data && (
        <div className="pointer-events-none absolute top-1 right-4 hidden h-9 items-center text-sm md:flex">
          <span className="text-muted-foreground">Total:&nbsp;</span>
          <span className="font-mono font-semibold tabular-nums text-money-in">
            R$ {formatMoney(data.totalIncome)}
          </span>
        </div>
      )}
      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        emptyMessage="Nenhum registro encontrado."
        getRowKey={(row) => row.id}
        mobileRow={renderIncomeLineItemMobile}
        mobileOnRowClick={setDetail}
        searchable={isEmbedded ? false : { placeholder: 'Buscar entradas...' }}
        columnToggle
        tableId={isEmbedded ? 'income-report-embedded' : 'income-report'}
        filters={filters}
        onFilterChange={(columnId, value) => {
          setFilters((prev) => ({ ...prev, [columnId]: value }));
          setPage(1);
        }}
      />
      {data && (
        <div className="flex justify-end border-t px-4 py-2">
          <Pagination currentPage={page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}
      <RowDetailPanel
        open={detail !== null}
        onOpenChange={(open) => !open && setDetail(null)}
        title="Detalhes da entrada"
        fields={detail ? buildIncomeLineItemFields(detail) : []}
        actions={
          detail && rowActions && (canEdit || canDelete) ? (
            <div className="flex justify-end gap-2">
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const row = detail;
                    setDetail(null);
                    rowActions.onEdit(row.id);
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
                    rowActions.onDelete(row);
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
