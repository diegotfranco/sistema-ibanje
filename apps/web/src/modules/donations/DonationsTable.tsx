import { useMemo } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import type { IncomeEntryResponse } from '@/schemas/donation';

type Props = {
  data: IncomeEntryResponse[];
  page: number;
  total: number;
  limit: number;
  onPageChange: (p: number) => void;
  loading?: boolean;
  emptyMessage?: string;
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatBRL(value: string): string {
  const num = parseFloat(value);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(num);
}

function getAttributionMonthDisplay(attributionMonth: string | null): string {
  if (!attributionMonth) return '—';
  const [year, month] = attributionMonth.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export default function DonationsTable({
  data,
  page,
  total,
  limit,
  onPageChange,
  loading,
  emptyMessage = 'Nenhuma contribuição encontrada.'
}: Props) {
  const maxPages = Math.ceil(total / limit);

  const rows = useMemo(() => data, [data]);

  if (loading) {
    return <div className="py-4 text-center text-sm text-muted-foreground">Carregando...</div>;
  }

  if (!rows.length) {
    return <div className="py-4 text-center text-sm text-muted-foreground">{emptyMessage}</div>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell className="font-semibold">Data</TableCell>
            <TableCell className="font-semibold">Mês de Referência</TableCell>
            <TableCell className="font-semibold text-right">Valor</TableCell>
            <TableCell className="font-semibold">Categoria</TableCell>
            <TableCell className="font-semibold">Forma de Pagamento</TableCell>
            <TableCell className="font-semibold">Fundo</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{formatDate(entry.referenceDate)}</TableCell>
              <TableCell>{getAttributionMonthDisplay(entry.attributionMonth)}</TableCell>
              <TableCell className="text-right font-mono">{formatBRL(entry.amount)}</TableCell>
              <TableCell>{entry.categoryName}</TableCell>
              <TableCell>{entry.paymentMethodName}</TableCell>
              <TableCell>{entry.designatedFundName ?? '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {maxPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={maxPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
