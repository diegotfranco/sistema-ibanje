import { useState } from 'react';
import { DataTable } from '@/components/DataTable';
import { Pagination } from '@/components/Pagination';
import { MobileRowDetailSheet } from '@/components/MobileRowDetailSheet';
import { formatMoney } from '../entries-utils';
import { useIncomeReport } from './useReports';
import {
  incomeLineItemColumns,
  renderIncomeLineItemMobile,
  buildIncomeLineItemFields
} from './income-line-item-display';
import type { IncomeReportRow } from './schema';

interface Props {
  month: string;
}

export function IncomeReportTab({ month }: Props) {
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<IncomeReportRow | null>(null);
  const { data, isLoading } = useIncomeReport(month, page);

  const rows = data?.data ?? [];

  return (
    <>
      {data && (
        <div className="pointer-events-none absolute top-3 right-4 hidden h-9 items-center text-sm md:flex">
          <span className="text-muted-foreground">Total:&nbsp;</span>
          <span className="font-mono font-semibold tabular-nums text-money-in">
            R$ {formatMoney(data.totalIncome)}
          </span>
        </div>
      )}
      <DataTable
        columns={incomeLineItemColumns}
        data={rows}
        isLoading={isLoading}
        emptyMessage="Nenhum registro encontrado."
        getRowKey={(row) => row.id}
        mobileRow={renderIncomeLineItemMobile}
        mobileOnRowClick={setDetail}
      />
      {data && (
        <div className="flex justify-end border-t px-4 py-2">
          <Pagination currentPage={page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}
      <MobileRowDetailSheet
        open={detail !== null}
        onOpenChange={(open) => !open && setDetail(null)}
        title="Detalhes da entrada"
        fields={detail ? buildIncomeLineItemFields(detail) : []}
      />
    </>
  );
}
