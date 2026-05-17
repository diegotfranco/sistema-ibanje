import { useState } from 'react';
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
import { useExpenseReport } from './useReports';

interface Props {
  month: string;
}

const formatDate = (s: string) => {
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
};

const formatMoney = (s: string) =>
  `R$ ${Number.parseFloat(s).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function ExpenseReportTab({ month }: Props) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useExpenseReport(month, page);

  const rows = data?.data ?? [];

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Saídas</CardTitle>
        {data && (
          <span className="text-sm text-muted-foreground">
            Total:{' '}
            <span className="font-semibold text-money-out">{formatMoney(data.totalExpenses)}</span>
          </span>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Grupo</TableHead>
              <TableHead>Fundo</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{formatDate(row.referenceDate)}</TableCell>
                <TableCell className="max-w-48 truncate">{row.description}</TableCell>
                <TableCell>{row.categoryName}</TableCell>
                <TableCell>{row.parentCategoryName ?? '—'}</TableCell>
                <TableCell>{row.fundName ?? '—'}</TableCell>
                <TableCell className="text-right font-mono">{formatMoney(row.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data && data.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}>
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {data.totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= data.totalPages}>
              Próxima
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
