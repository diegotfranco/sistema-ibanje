import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useFundDetail } from './useReports';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fundId: number;
  from: string;
  to: string;
}

const formatDate = (s: string) => {
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
};

const formatMoney = (s: string) =>
  `R$ ${parseFloat(s).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function FundDetailDialog({ open, onOpenChange, fundId, from, to }: Props) {
  const { data, isLoading } = useFundDetail(fundId, from, to);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data?.fundName ?? 'Fundo'}</DialogTitle>
        </DialogHeader>

        {isLoading && <p className="text-center text-muted-foreground py-4">Carregando...</p>}

        {data && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Arrecadado</p>
                <p className="font-mono font-semibold text-emerald-600">
                  {formatMoney(data.totalRaised)}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Saídas</p>
                <p className="font-mono font-semibold text-red-600">
                  {formatMoney(data.totalExpenses)}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Saldo</p>
                <p className="font-mono font-semibold">{formatMoney(data.balance)}</p>
              </div>
            </div>

            {/* Income entries */}
            <div>
              <h4 className="text-sm font-medium mb-2">Entradas</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Membro</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.incomeEntries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Nenhuma entrada.
                      </TableCell>
                    </TableRow>
                  )}
                  {data.incomeEntries.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{formatDate(row.referenceDate)}</TableCell>
                      <TableCell>{row.categoryName}</TableCell>
                      <TableCell>{row.memberName ?? '—'}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatMoney(row.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Expense entries */}
            <div>
              <h4 className="text-sm font-medium mb-2">Saídas</h4>
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
                  {data.expenseEntries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Nenhuma saída.
                      </TableCell>
                    </TableRow>
                  )}
                  {data.expenseEntries.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{formatDate(row.referenceDate)}</TableCell>
                      <TableCell className="max-w-40 truncate">{row.description}</TableCell>
                      <TableCell>{row.categoryName}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatMoney(row.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
