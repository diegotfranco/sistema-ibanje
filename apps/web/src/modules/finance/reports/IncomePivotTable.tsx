import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import type { IncomePivot } from '@/schemas/report';

interface Props {
  pivot: IncomePivot;
}

const formatDate = (s: string) => {
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
};

const formatMoney = (s: string) =>
  Number.parseFloat(s).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

export function IncomePivotTable({ pivot }: Props) {
  if (pivot.rows.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">Nenhuma entrada no período.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-background min-w-28">Data</TableHead>
            {pivot.columns.map((col) => (
              <TableHead key={col.key} className="text-right min-w-32">
                {col.label}
              </TableHead>
            ))}
            <TableHead className="text-right font-semibold min-w-32">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pivot.rows.map((row) => (
            <TableRow key={row.referenceDate}>
              <TableCell className="sticky left-0 bg-background font-medium">
                {formatDate(row.referenceDate)}
              </TableCell>
              {pivot.columns.map((col) => (
                <TableCell key={col.key} className="text-right font-mono">
                  {row.cells[col.key] ? formatMoney(row.cells[col.key]) : '—'}
                </TableCell>
              ))}
              <TableCell className="text-right font-mono font-semibold">
                {formatMoney(row.total)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <tfoot>
          <TableRow className="border-t-2 font-semibold">
            <TableCell className="sticky left-0 bg-background">Total</TableCell>
            {pivot.columns.map((col) => (
              <TableCell key={col.key} className="text-right font-mono">
                {formatMoney(col.total)}
              </TableCell>
            ))}
            <TableCell className="text-right font-mono text-money-in">
              {formatMoney(pivot.grandTotal)}
            </TableCell>
          </TableRow>
        </tfoot>
      </Table>
    </div>
  );
}
