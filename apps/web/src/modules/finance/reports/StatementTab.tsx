import { useState } from 'react';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useFinancialStatement, useDetailedStatement, usePdfDownload } from './useReports';
import { IncomePivotTable } from './IncomePivotTable';

interface Props {
  month: string;
}

const formatMoney = (s: string) =>
  `R$ ${Number.parseFloat(s).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (s: string) => {
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
};

export function StatementTab({ month }: Props) {
  const [view, setView] = useState<'simple' | 'detailed'>('simple');
  const simple = useFinancialStatement(month);
  const detailed = useDetailedStatement(month);
  const pdfDownload = usePdfDownload();

  const params = new URLSearchParams({ month }).toString();

  return (
    <div className="mt-4 space-y-4">
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
          {simple.data && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  { label: 'Saldo Inicial', value: simple.data.openingBalance, color: '' },
                  {
                    label: 'Total Entradas',
                    value: simple.data.totalIncome,
                    color: 'text-money-in'
                  },
                  {
                    label: 'Total Saídas',
                    value: simple.data.totalExpenses,
                    color: 'text-money-out'
                  },
                  { label: 'Saldo Atual', value: simple.data.currentBalance, color: '' }
                ].map((card) => (
                  <Card key={card.label}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {card.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-lg font-mono font-semibold ${card.color}`}>
                        {formatMoney(card.value)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Entradas por categoria */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Entradas por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Grupo</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {simple.data.incomeByCategory.map((row) => (
                        <TableRow key={`category-${row.categoryName}`}>
                          <TableCell>{row.parentCategoryName ?? '—'}</TableCell>
                          <TableCell>{row.categoryName}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatMoney(row.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Entradas por fundo */}
              {simple.data.incomeByFund.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Entradas por Fundo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fundo</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {simple.data.incomeByFund.map((row) => (
                          <TableRow key={row.fundId}>
                            <TableCell>{row.fundName}</TableCell>
                            <TableCell className="text-right font-mono">
                              {formatMoney(row.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Saídas por categoria */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Saídas por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Grupo</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {simple.data.expensesByCategory.map((row) => (
                        <TableRow key={`expense-${row.categoryName}`}>
                          <TableCell>{row.parentCategoryName ?? '—'}</TableCell>
                          <TableCell>{row.categoryName}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatMoney(row.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
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
                  <CardTitle className="text-base">Entradas (Pivot)</CardTitle>
                </CardHeader>
                <CardContent>
                  <IncomePivotTable pivot={detailed.data.incomePivot} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Saídas</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailed.data.expenseEntries.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            Nenhuma saída no período.
                          </TableCell>
                        </TableRow>
                      )}
                      {detailed.data.expenseEntries.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{formatDate(row.referenceDate)}</TableCell>
                          <TableCell className="max-w-48 truncate">{row.description}</TableCell>
                          <TableCell>{row.categoryName}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatMoney(row.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
