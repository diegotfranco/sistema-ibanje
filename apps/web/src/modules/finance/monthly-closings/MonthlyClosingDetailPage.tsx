import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { AlertTriangle, ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader, CardHeaderRow, CardTitle } from '@/components/Card';
import { PageContainer } from '@/components/PageContainer';
import StatusBadge from '@/components/StatusBadge';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { ClosingStatus } from '@sistema-ibanje/shared';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { useMonthlyClosingById, useRemoveMonthlyClosing } from './useMonthlyClosings';
import { ClosingTransitionDialog } from './ClosingTransitionDialog';
import { IncomeReportTab } from '../reports/IncomeReportTab';
import { ExpenseReportTab } from '../reports/ExpenseReportTab';

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

const monthParam = (year: number, month: number) => `${year}-${String(month).padStart(2, '0')}`;

const formatMoney = (s: string) =>
  `R$ ${Number.parseFloat(s).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type TransitionAction = 'submit' | 'approve' | 'reject' | 'close';

interface SummaryTileProps {
  label: string;
  value: string;
  valueClassName?: string;
  hint?: string;
}

function SummaryTile({ label, value, valueClassName, hint }: SummaryTileProps) {
  return (
    <Card>
      <CardHeader compact>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <p className={`text-lg font-mono font-semibold tabular-nums ${valueClassName ?? ''}`}>
          {value}
        </p>
        {hint && (
          <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
            <AlertTriangle className="h-3 w-3" />
            {hint}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function MonthlyClosingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const perms = user?.permissions;

  const canCreate = hasPermission(perms, Module.MonthlyClosings, Action.Create);
  const canEdit = hasPermission(perms, Module.MonthlyClosings, Action.Update);
  const canDelete = hasPermission(perms, Module.MonthlyClosings, Action.Delete);
  const canReview = hasPermission(perms, Module.MonthlyClosings, Action.Review);
  const canViewReports = hasPermission(perms, Module.Reports, Action.Report);

  const { data: closing, isLoading } = useMonthlyClosingById(Number(id));
  const remove = useRemoveMonthlyClosing();

  const [transitionAction, setTransitionAction] = useState<TransitionAction | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="text-center text-muted-foreground">Carregando...</div>
      </PageContainer>
    );
  }

  if (!closing) {
    return (
      <PageContainer>
        <div className="text-center text-muted-foreground">Fechamento não encontrado.</div>
      </PageContainer>
    );
  }

  const month = monthParam(closing.periodYear, closing.periodMonth);

  const hasActions =
    closing.status !== ClosingStatus.Closed &&
    ((closing.status === ClosingStatus.Open && (canCreate || canDelete)) ||
      (closing.status === ClosingStatus.InReview && canReview) ||
      (closing.status === ClosingStatus.Approved && canEdit));

  return (
    <>
      <PageContainer>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/monthly-closings')}
            aria-label="Voltar">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">
            {formatPeriod(closing.periodYear, closing.periodMonth)}
          </h1>
          <StatusBadge status={closing.status} />
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryTile
            label="Saldo Inicial"
            value={formatMoney(closing.openingBalance)}
            hint={closing.openingBalancePending ? 'Estimado' : undefined}
          />
          <SummaryTile label="Saldo Final" value={formatMoney(closing.closingBalance)} />
          <SummaryTile
            label="Total de Entradas"
            value={formatMoney(closing.totalIncome)}
            valueClassName="text-money-in"
          />
          <SummaryTile
            label="Total de Saídas"
            value={formatMoney(closing.totalExpenses)}
            valueClassName="text-money-out"
          />
        </div>

        {(closing.treasurerNotes || closing.accountantNotes || hasActions) && (
          <Card>
            <CardContent className="space-y-4 pt-6 pb-4">
              {(closing.treasurerNotes || closing.accountantNotes) && (
                <section>
                  <h2 className="mb-3 text-sm font-medium text-primary-soft">Observações</h2>
                  <dl className="grid gap-3 sm:grid-cols-2">
                    {closing.treasurerNotes && (
                      <div className="border-l-2 border-primary-soft/40 pl-3">
                        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Tesoureiro
                        </dt>
                        <dd className="mt-1 text-sm whitespace-pre-line">
                          {closing.treasurerNotes}
                        </dd>
                      </div>
                    )}
                    {closing.accountantNotes && (
                      <div className="border-l-2 border-primary-soft/40 pl-3">
                        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Contador
                        </dt>
                        <dd className="mt-1 text-sm whitespace-pre-line">
                          {closing.accountantNotes}
                        </dd>
                      </div>
                    )}
                  </dl>
                </section>
              )}

              {(closing.treasurerNotes || closing.accountantNotes) && hasActions && (
                <div className="border-t" />
              )}

              {hasActions && (
                <section
                  className={
                    closing.treasurerNotes || closing.accountantNotes ? 'pt-1' : undefined
                  }>
                  <h2 className="mb-3 text-sm font-medium text-primary-soft">Ações</h2>
                  <div className="flex flex-wrap gap-2">
                    {closing.status === ClosingStatus.Open && canCreate && (
                      <Button onClick={() => setTransitionAction('submit')}>
                        Submeter para Revisão
                      </Button>
                    )}
                    {closing.status === ClosingStatus.InReview && canReview && (
                      <>
                        <Button onClick={() => setTransitionAction('approve')}>Aprovar</Button>
                        <Button variant="destructive" onClick={() => setTransitionAction('reject')}>
                          Rejeitar
                        </Button>
                      </>
                    )}
                    {closing.status === ClosingStatus.Approved && canEdit && (
                      <Button onClick={() => setTransitionAction('close')}>Fechar Período</Button>
                    )}
                    {closing.status === ClosingStatus.Open && canDelete && (
                      <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                        <Trash2 size={16} className="mr-1" />
                        Excluir
                      </Button>
                    )}
                  </div>
                </section>
              )}
            </CardContent>
          </Card>
        )}

        {canViewReports && (
          <>
            <Card className="relative gap-0 py-0">
              <CardHeaderRow className="border-b py-4">
                <CardTitle>Entradas do período</CardTitle>
              </CardHeaderRow>
              <CardContent className="p-0">
                <IncomeReportTab month={month} />
              </CardContent>
            </Card>

            <Card className="relative gap-0 py-0">
              <CardHeaderRow className="border-b py-4">
                <CardTitle>Saídas do período</CardTitle>
              </CardHeaderRow>
              <CardContent className="p-0">
                <ExpenseReportTab month={month} />
              </CardContent>
            </Card>
          </>
        )}
      </PageContainer>

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
