import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { DataTable } from '@/components/DataTable';
import { formatDate } from '@/lib/datetime';
import { useFinancialStatement, useDetailedStatement, usePdfDownload } from './useReports';
import { FinancialStatementDocument } from './FinancialStatementDocument';
import { IncomeBreakdown } from './IncomeBreakdown';

interface Props {
  month: string;
}

const formatMoney = (s: string) =>
  `R$ ${Number.parseFloat(s).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function StatementTab({ month }: Props) {
  const [view, setView] = useState<'simple' | 'detailed'>('simple');
  const simple = useFinancialStatement(month);
  const detailed = useDetailedStatement(month);
  const pdfDownload = usePdfDownload();

  const params = new URLSearchParams({ month }).toString();

  const detailedExpenseColumns: ColumnDef<
    NonNullable<typeof detailed.data>['expenseEntries'][number],
    unknown
  >[] = [
    {
      id: 'date',
      header: 'Data',
      cell: (info) => formatDate(info.row.original.date)
    },
    {
      id: 'category',
      header: 'Categoria',
      cell: (info) => info.row.original.categoryName,
      meta: { className: 'w-full' }
    },
    {
      id: 'amount',
      header: 'Valor',
      meta: { align: 'right' },
      cell: (info) => <span className="font-mono">{formatMoney(info.row.original.amount)}</span>
    }
  ];

  const renderDetailedExpenseMobile = (
    row: NonNullable<typeof detailed.data>['expenseEntries'][number]
  ) => (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm tabular-nums text-muted-foreground">{formatDate(row.date)}</span>
        <span className="font-mono tabular-nums text-sm font-semibold text-money-out">
          {formatMoney(row.amount)}
        </span>
      </div>
      <div className="text-sm font-medium">{row.categoryName}</div>
      {row.notes && (
        <p className="text-xs text-muted-foreground line-clamp-2" title={row.notes}>
          {row.notes}
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-4 p-4">
      {/* Sub-toggle + PDF button */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={view === 'simple' ? 'default' : 'outline'}
            onClick={() => setView('simple')}>
            Simplificado
          </Button>
          <Button
            size="sm"
            variant={view === 'detailed' ? 'default' : 'outline'}
            onClick={() => setView('detailed')}>
            Detalhado
          </Button>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            pdfDownload.mutate(
              view === 'simple'
                ? `/reports/financial-statement/pdf?${params}`
                : `/reports/financial-statement/detailed/pdf?${params}`
            )
          }
          disabled={pdfDownload.isPending}>
          <FileDown className="h-4 w-4 mr-1" />
          {pdfDownload.isPending ? 'Baixando...' : 'Baixar PDF'}
        </Button>
      </div>

      {/* Simple view */}
      {view === 'simple' && (
        <>
          {simple.isLoading && <p className="text-center text-muted-foreground">Carregando...</p>}
          {simple.data && <FinancialStatementDocument data={simple.data} />}
        </>
      )}

      {/* Detailed view */}
      {view === 'detailed' && (
        <>
          {detailed.isLoading && <p className="text-center text-muted-foreground">Carregando...</p>}
          {detailed.data && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Entradas</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <IncomeBreakdown pivot={detailed.data.incomePivot} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Saídas</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <DataTable
                    columns={detailedExpenseColumns}
                    data={detailed.data.expenseEntries}
                    emptyMessage="Nenhuma saída no período."
                    getRowKey={(row) => row.id}
                    mobileRow={renderDetailedExpenseMobile}
                  />
                  <div className="flex items-baseline justify-between gap-3 border-t px-4 py-3 text-sm font-semibold">
                    <span>Total Saídas</span>
                    <span className="font-mono tabular-nums whitespace-nowrap text-money-out">
                      {formatMoney(detailed.data.totalExpenses)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
