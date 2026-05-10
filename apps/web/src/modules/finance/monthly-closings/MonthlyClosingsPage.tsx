import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus } from 'lucide-react';
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
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import StatusBadge from '@/components/StatusBadge';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { ClosingStatus } from '@sistema-ibanje/shared';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { useMonthlyClosings, useRemoveMonthlyClosing } from './useMonthlyClosings';
import { NewClosingDialog } from './NewClosingDialog';
import type { MonthlyClosingResponse } from '@/schemas/monthly-closing';

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

const formatPeriod = (year: number, month: number) => `${MONTHS[month - 1]} ${year}`;

const formatMoney = (s: string) =>
  `R$ ${parseFloat(s).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function MonthlyClosingsPage() {
  const { data: user } = useCurrentUser();
  const perms = user?.permissions;
  const canCreate = hasPermission(perms, Module.MonthlyClosings, Action.Create);
  const canDelete = hasPermission(perms, Module.MonthlyClosings, Action.Delete);

  const list = useMonthlyClosings();
  const remove = useRemoveMonthlyClosing();
  const navigate = useNavigate();

  const [newOpen, setNewOpen] = useState(false);
  const [deleting, setDeleting] = useState<MonthlyClosingResponse | null>(null);

  const items = list.data?.data ?? [];

  return (
    <>
      <div className="p-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Fechamentos Mensais</CardTitle>
            {canCreate && (
              <Button onClick={() => setNewOpen(true)} size="sm">
                <Plus className="h-4 w-4" />
                Novo
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Entradas</TableHead>
                  <TableHead>Saídas</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead className="w-32 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}
                {!list.isLoading && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nenhum fechamento encontrado.
                    </TableCell>
                  </TableRow>
                )}
                {items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      {formatPeriod(row.periodYear, row.periodMonth)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="font-mono text-emerald-600">
                      {formatMoney(row.totalIncome)}
                    </TableCell>
                    <TableCell className="font-mono text-red-600">
                      {formatMoney(row.totalExpenses)}
                    </TableCell>
                    <TableCell className="font-mono">{formatMoney(row.closingBalance)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/monthly-closings/${row.id}`)}>
                          Abrir
                        </Button>
                        {canDelete && row.status === ClosingStatus.Open && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => setDeleting(row)}>
                            Excluir
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <NewClosingDialog open={newOpen} onOpenChange={setNewOpen} />

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(v) => !v && setDeleting(null)}
        description={`Tem certeza que deseja excluir o fechamento de ${deleting ? formatPeriod(deleting.periodYear, deleting.periodMonth) : ''}?`}
        onConfirm={() =>
          deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
        }
        isPending={remove.isPending}
      />
    </>
  );
}
