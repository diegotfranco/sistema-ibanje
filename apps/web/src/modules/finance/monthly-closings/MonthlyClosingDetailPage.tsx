import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import StatusBadge from '@/components/StatusBadge';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { useMonthlyClosingById, useRemoveMonthlyClosing } from './useMonthlyClosings';
import { ClosingTransitionDialog } from './ClosingTransitionDialog';

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

type TransitionAction = 'submit' | 'approve' | 'reject' | 'close';

export default function MonthlyClosingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const perms = user?.permissions;

  const canCreate = hasPermission(perms, Module.MonthlyClosings, Action.Create);
  const canEdit = hasPermission(perms, Module.MonthlyClosings, Action.Update);
  const canDelete = hasPermission(perms, Module.MonthlyClosings, Action.Delete);
  const canReview = hasPermission(perms, Module.MonthlyClosings, Action.Review);

  const { data: closing, isLoading } = useMonthlyClosingById(Number(id));
  const remove = useRemoveMonthlyClosing();

  const [transitionAction, setTransitionAction] = useState<TransitionAction | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  }

  if (!closing) {
    return <div className="p-8 text-center text-muted-foreground">Fechamento não encontrado.</div>;
  }

  return (
    <>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/monthly-closings')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">
              {formatPeriod(closing.periodYear, closing.periodMonth)}
            </h1>
            <div className="mt-1">
              <StatusBadge status={closing.status} />
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Saldo Inicial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-mono font-semibold">
                {formatMoney(closing.openingBalance)}
              </p>
              {closing.openingBalancePending && (
                <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  Estimado
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Entradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-mono font-semibold text-emerald-600">
                {formatMoney(closing.totalIncome)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Saídas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-mono font-semibold text-red-600">
                {formatMoney(closing.totalExpenses)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Saldo Final
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-mono font-semibold">
                {formatMoney(closing.closingBalance)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Reserved funds */}
        {closing.totalReservedFunds !== undefined && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Fundos Reservados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-mono font-semibold">
                {formatMoney(closing.totalReservedFunds)}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {(closing.treasurerNotes || closing.accountantNotes) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {closing.treasurerNotes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tesoureiro</p>
                  <p className="mt-1 text-sm">{closing.treasurerNotes}</p>
                </div>
              )}
              {closing.treasurerNotes && closing.accountantNotes && <Separator />}
              {closing.accountantNotes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contador</p>
                  <p className="mt-1 text-sm">{closing.accountantNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action buttons */}
        {closing.status !== 'fechado' && (
          <div className="flex flex-wrap gap-2">
            {closing.status === 'aberto' && canCreate && (
              <Button onClick={() => setTransitionAction('submit')}>Submeter para Revisão</Button>
            )}
            {closing.status === 'em revisão' && canReview && (
              <>
                <Button onClick={() => setTransitionAction('approve')}>Aprovar</Button>
                <Button variant="outline" onClick={() => setTransitionAction('reject')}>
                  Rejeitar
                </Button>
              </>
            )}
            {closing.status === 'aprovado' && canEdit && (
              <Button onClick={() => setTransitionAction('close')}>Fechar Período</Button>
            )}
            {closing.status === 'aberto' && canDelete && (
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700 border-red-200"
                onClick={() => setDeleteOpen(true)}>
                Excluir
              </Button>
            )}
          </div>
        )}
      </div>

      {transitionAction && (
        <ClosingTransitionDialog
          open={transitionAction !== null}
          onOpenChange={(v) => !v && setTransitionAction(null)}
          closingId={closing.id}
          action={transitionAction}
        />
      )}

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        description={`Tem certeza que deseja excluir o fechamento de ${formatPeriod(closing.periodYear, closing.periodMonth)}?`}
        onConfirm={() =>
          remove.mutate(closing.id, {
            onSuccess: () => navigate('/monthly-closings')
          })
        }
        isPending={remove.isPending}
      />
    </>
  );
}
