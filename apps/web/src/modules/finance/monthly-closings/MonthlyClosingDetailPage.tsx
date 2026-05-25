import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader, CardHeaderRow, CardTitle } from '@/components/Card';
import { PageContainer } from '@/components/PageContainer';
import StatusBadge from '@/components/StatusBadge';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { ClosingStatus } from '@sistema-ibanje/shared';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { useMonthlyClosingById, useRemoveMonthlyClosing } from './useMonthlyClosings';
import { ClosingTransitionDialog } from './ClosingTransitionDialog';
import { IncomeReportTab } from '../reports/IncomeReportTab';
import { ExpenseReportTab } from '../reports/ExpenseReportTab';
import {
  useExpenseEntryById,
  useExpenseEntryMutations,
  useUploadReceipt,
  useDeleteReceipt
} from '../expense-entries/useExpenseEntries';
import { ExpenseEntryForm } from '../expense-entries/ExpenseEntryForm';
import { useIncomeEntryById, useIncomeEntryMutations } from '../income-entries/useIncomeEntries';
import { IncomeEntryForm } from '../income-entries/IncomeEntryForm';
import type { ExpenseEntryFormValues } from '../expense-entries/schema';
import type { IncomeEntryFormValues } from '../income-entries/schema';
import type { ExpenseReportRow, IncomeReportRow } from '../reports/schema';
import { formatMoney as formatAmount } from '../entries-utils';

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

type TransitionAction = 'submit' | 'approve' | 'reject' | 'close' | 'reopen' | 'resubmit';

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
  const qc = useQueryClient();
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

  // Inline edit/delete state for embedded income/expense rows
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<ExpenseReportRow | null>(null);
  const [editingIncomeId, setEditingIncomeId] = useState<number | null>(null);
  const [deletingIncome, setDeletingIncome] = useState<IncomeReportRow | null>(null);

  const expenseEntry = useExpenseEntryById(editingExpenseId);
  const incomeEntry = useIncomeEntryById(editingIncomeId);
  const expenseMutations = useExpenseEntryMutations();
  const incomeMutations = useIncomeEntryMutations();
  const uploadReceipt = useUploadReceipt();
  const deleteReceipt = useDeleteReceipt();

  const invalidateReports = () => qc.invalidateQueries({ queryKey: ['reports'] });

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

  const isOpen = closing.status === ClosingStatus.Open;
  const canEditExpense = isOpen && hasPermission(perms, Module.ExpenseEntries, Action.Update);
  const canDeleteExpense = isOpen && hasPermission(perms, Module.ExpenseEntries, Action.Delete);
  const canEditIncome = isOpen && hasPermission(perms, Module.IncomeEntries, Action.Update);
  const canDeleteIncome = isOpen && hasPermission(perms, Module.IncomeEntries, Action.Delete);

  const expenseRowActions =
    canEditExpense || canDeleteExpense
      ? {
          canEdit: canEditExpense,
          canDelete: canDeleteExpense,
          onEdit: (entryId: number) => setEditingExpenseId(entryId),
          onDelete: (row: ExpenseReportRow) => setDeletingExpense(row)
        }
      : undefined;

  const incomeRowActions =
    canEditIncome || canDeleteIncome
      ? {
          canEdit: canEditIncome,
          canDelete: canDeleteIncome,
          onEdit: (entryId: number) => setEditingIncomeId(entryId),
          onDelete: (row: IncomeReportRow) => setDeletingIncome(row)
        }
      : undefined;

  const hasActions =
    closing.status !== ClosingStatus.Closed &&
    ((closing.status === ClosingStatus.Open && (canCreate || canDelete)) ||
      (closing.status === ClosingStatus.InReview && canReview) ||
      (closing.status === ClosingStatus.Approved && canEdit) ||
      (closing.status === ClosingStatus.Rejected && canCreate));

  const toExpenseCreateBody = (values: ExpenseEntryFormValues) => {
    const amountNum = Number.parseFloat(values.amount);
    return {
      date: values.date,
      amount: amountNum,
      total: values.isInstallment ? Number.parseFloat(values.total!) : amountNum,
      installment: values.isInstallment ? values.installment! : 1,
      totalInstallments: values.isInstallment ? values.totalInstallments! : 1,
      categoryId: values.categoryId!,
      paymentMethodId: values.paymentMethodId!,
      ...(values.designatedFundId !== undefined
        ? { designatedFundId: values.designatedFundId }
        : {}),
      ...(values.attenderId !== undefined ? { attenderId: values.attenderId } : {}),
      ...(values.notes ? { notes: values.notes } : {})
    };
  };

  const toIncomeUpdateBody = (values: IncomeEntryFormValues) => ({
    depositDate: values.depositDate,
    amount: Number.parseFloat(values.amount),
    categoryId: values.categoryId!,
    paymentMethodId: values.paymentMethodId!,
    ...(values.attenderId !== undefined ? { attenderId: values.attenderId } : {}),
    ...(values.designatedFundId !== undefined ? { designatedFundId: values.designatedFundId } : {}),
    ...(values.notes ? { notes: values.notes } : {}),
    ...(values.status ? { status: values.status } : {})
  });

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
                    {closing.status === ClosingStatus.Rejected && canCreate && (
                      <>
                        <Button onClick={() => setTransitionAction('resubmit')}>
                          Submeter para revisão novamente
                        </Button>
                        <Button variant="outline" onClick={() => setTransitionAction('reopen')}>
                          Reabrir
                        </Button>
                      </>
                    )}
                    {closing.status === ClosingStatus.Approved && canEdit && (
                      <>
                        <Button onClick={() => setTransitionAction('close')}>Fechar Período</Button>
                        <Button variant="outline" onClick={() => setTransitionAction('reopen')}>
                          Reabrir
                        </Button>
                      </>
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
                <IncomeReportTab month={month} mode="embedded" rowActions={incomeRowActions} />
              </CardContent>
            </Card>

            <Card className="relative gap-0 py-0">
              <CardHeaderRow className="border-b py-4">
                <CardTitle>Saídas do período</CardTitle>
              </CardHeaderRow>
              <CardContent className="p-0">
                <ExpenseReportTab month={month} mode="embedded" rowActions={expenseRowActions} />
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

      <Dialog
        open={editingExpenseId !== null}
        onOpenChange={(v) => !v && setEditingExpenseId(null)}>
        <DialogContent className="sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar lançamento de saída</DialogTitle>
          </DialogHeader>
          {expenseEntry.data && (
            <ExpenseEntryForm
              initialValues={expenseEntry.data}
              isPending={
                expenseMutations.update.isPending ||
                uploadReceipt.isPending ||
                deleteReceipt.isPending
              }
              onSubmit={(values, receipt) => {
                const body = toExpenseCreateBody(values);
                const updateBody = {
                  ...body,
                  ...(values.status ? { status: values.status } : {})
                };
                const entryId = expenseEntry.data!.id;
                expenseMutations.update.mutate(
                  { id: entryId, body: updateBody },
                  {
                    onSuccess: async () => {
                      try {
                        if (receipt.stagedRemoval) {
                          await deleteReceipt.mutateAsync(entryId);
                        } else if (receipt.stagedFile) {
                          await uploadReceipt.mutateAsync({
                            id: entryId,
                            file: receipt.stagedFile
                          });
                        }
                        invalidateReports();
                        setEditingExpenseId(null);
                      } catch {
                        // mutation hooks already toasted; keep dialog open
                      }
                    }
                  }
                );
              }}
              onCancel={() => setEditingExpenseId(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deletingExpense !== null}
        onOpenChange={(v) => !v && setDeletingExpense(null)}
        description={`Tem certeza que deseja remover o lançamento "${deletingExpense?.categoryName ?? ''}"?`}
        onConfirm={() =>
          deletingExpense &&
          expenseMutations.remove.mutate(deletingExpense.id, {
            onSuccess: () => {
              invalidateReports();
              setDeletingExpense(null);
            }
          })
        }
        isPending={expenseMutations.remove.isPending}
      />

      <Dialog open={editingIncomeId !== null} onOpenChange={(v) => !v && setEditingIncomeId(null)}>
        <DialogContent className="sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar lançamento de entrada</DialogTitle>
          </DialogHeader>
          {incomeEntry.data && (
            <IncomeEntryForm
              initialValues={incomeEntry.data}
              isPending={incomeMutations.update.isPending}
              onSubmit={(values) => {
                incomeMutations.update.mutate(
                  { id: incomeEntry.data!.id, body: toIncomeUpdateBody(values) },
                  {
                    onSuccess: () => {
                      invalidateReports();
                      setEditingIncomeId(null);
                    }
                  }
                );
              }}
              onCancel={() => setEditingIncomeId(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deletingIncome !== null}
        onOpenChange={(v) => !v && setDeletingIncome(null)}
        description={`Tem certeza que deseja remover este lançamento de R$ ${deletingIncome ? formatAmount(deletingIncome.amount) : ''}?`}
        onConfirm={() =>
          deletingIncome &&
          incomeMutations.remove.mutate(deletingIncome.id, {
            onSuccess: () => {
              invalidateReports();
              setDeletingIncome(null);
            }
          })
        }
        isPending={incomeMutations.remove.isPending}
      />
    </>
  );
}
