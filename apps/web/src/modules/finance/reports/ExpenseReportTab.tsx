import { useState } from 'react';
import { DataTable } from '@/components/DataTable';
import { Pagination } from '@/components/Pagination';
import { RowDetailPanel } from '@/components/RowDetailPanel';
import { RowDetailFooterActions } from '../components/RowActions';
import {
  buildExpenseLineItemColumns,
  renderExpenseLineItemMobile,
  buildExpenseLineItemFields
} from './expense-line-item-display';
import { formatMoney } from '../entries-utils';
import { useExpenseReport } from './useReports';
import type { ExpenseReportRow } from './schema';

export interface ExpenseRowActions {
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (id: number) => void;
  onDelete: (row: ExpenseReportRow) => void;
}

interface Props {
  month: string;
  mode?: 'full' | 'embedded';
  rowActions?: ExpenseRowActions;
}

export function ExpenseReportTab({ month, mode = 'full', rowActions }: Props) {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const [detail, setDetail] = useState<ExpenseReportRow | null>(null);
  const limit = mode === 'embedded' ? 15 : 30;
  const { data, isLoading } = useExpenseReport(month, page, limit, filters);
  const isEmbedded = mode === 'embedded';

  const rows = data?.data ?? [];

  const columns = buildExpenseLineItemColumns<ExpenseReportRow>({
    statusFilter: true,
    actions: rowActions
      ? {
          onView: setDetail,
          onEdit: rowActions.canEdit ? (row) => rowActions.onEdit(row.id) : undefined,
          onDelete: rowActions.canDelete ? (row) => rowActions.onDelete(row) : undefined
        }
      : undefined
  });

  return (
    <>
      {data && (
        <div className="pointer-events-none absolute top-1 right-4 hidden h-9 items-center text-sm md:flex">
          <span className="text-muted-foreground">Total:&nbsp;</span>
          <span className="font-mono font-semibold tabular-nums text-money-out">
            R$ {formatMoney(data.totalExpenses)}
          </span>
        </div>
      )}
      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        emptyMessage="Nenhum registro encontrado."
        getRowKey={(row) => row.id}
        mobileRow={renderExpenseLineItemMobile}
        mobileOnRowClick={setDetail}
        searchable={isEmbedded ? false : { placeholder: 'Buscar saídas...' }}
        columnToggle
        tableId={isEmbedded ? 'expense-report-embedded' : 'expense-report'}
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
        title="Detalhes da saída"
        fields={detail ? buildExpenseLineItemFields(detail) : []}
        actions={
          detail && rowActions ? (
            <RowDetailFooterActions
              onEdit={
                rowActions.canEdit
                  ? () => {
                      const row = detail;
                      setDetail(null);
                      rowActions.onEdit(row.id);
                    }
                  : undefined
              }
              onDelete={
                rowActions.canDelete
                  ? () => {
                      const row = detail;
                      setDetail(null);
                      rowActions.onDelete(row);
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
