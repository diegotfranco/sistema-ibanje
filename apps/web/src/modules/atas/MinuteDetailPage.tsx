import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RichTextEditor, RichTextDisplay } from '@/components/ui/rich-text-editor';
import { MinuteStatus } from '@/lib/status';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import {
  useMinuteById,
  useUpdatePendingVersion,
  useEditApprovedMinute,
  useApproveMinute
} from './useMinutes';
import { EditApprovedMinuteSchema, type EditApprovedMinuteValues } from '@/schemas/minute';

function statusClass(status: string) {
  if (status === MinuteStatus.Approved)
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
  if (status === MinuteStatus.Replaced)
    return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR');
}

export default function MinuteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const minuteId = Number(id);
  const navigate = useNavigate();

  const { data: user } = useCurrentUser();
  const perms = user?.permissions;
  const canEdit = hasPermission(perms, Module.Minutes, Action.Update);
  const canReview = hasPermission(perms, Module.Minutes, Action.Review);

  const { data: minute, isLoading } = useMinuteById(minuteId);
  const updatePending = useUpdatePendingVersion(minuteId);
  const editApproved = useEditApprovedMinute(minuteId);
  const approveMinute = useApproveMinute(minuteId);

  const [editPendingOpen, setEditPendingOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [editApprovedOpen, setEditApprovedOpen] = useState(false);

  const editApprovedForm = useForm<EditApprovedMinuteValues>({
    resolver: zodResolver(EditApprovedMinuteSchema),
    defaultValues: { content: '', reasonForChange: '' }
  });

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">Carregando...</div>;
  }
  if (!minute) {
    return <div className="p-8 text-muted-foreground">Ata não encontrada.</div>;
  }

  const current = minute.currentVersion;
  const sortedVersions = [...minute.versions].sort((a, b) => b.version - a.version);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/minutes')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{minute.minuteNumber}</h1>
          {current && (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1 ${statusClass(current.status)}`}>
              {current.status}
            </span>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conteúdo</CardTitle>
        </CardHeader>
        <CardContent>
          {current ? (
            <RichTextDisplay html={current.content} className="text-sm" />
          ) : (
            <p className="text-muted-foreground text-sm">Sem conteúdo.</p>
          )}

          {current && (
            <div className="flex gap-2 mt-4">
              {current.status === MinuteStatus.AwaitingApproval && canEdit && (
                <Button size="sm" variant="outline" onClick={() => setEditPendingOpen(true)}>
                  Editar Rascunho
                </Button>
              )}
              {current.status === MinuteStatus.AwaitingApproval && canReview && (
                <Button size="sm" onClick={() => setApproveOpen(true)}>
                  Aprovar
                </Button>
              )}
              {current.status === MinuteStatus.Approved && canEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    editApprovedForm.reset({ content: current.content, reasonForChange: '' });
                    setEditApprovedOpen(true);
                  }}>
                  Criar Nova Versão
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Versões</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Versão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedVersions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Sem versões.
                  </TableCell>
                </TableRow>
              )}
              {sortedVersions.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>v{v.version}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(v.status)}`}>
                      {v.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {v.reasonForChange ?? '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(v.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit pending version dialog */}
      <EditPendingDialog
        open={editPendingOpen}
        onOpenChange={setEditPendingOpen}
        currentContent={current?.content ?? ''}
        onSubmit={(content) =>
          updatePending.mutate({ content }, { onSuccess: () => setEditPendingOpen(false) })
        }
        isPending={updatePending.isPending}
      />

      {/* Approve dialog */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Aprovar Ata</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Confirmar a aprovação da versão atual? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveOpen(false)}
              disabled={approveMinute.isPending}>
              Cancelar
            </Button>
            <Button
              onClick={() => approveMinute.mutate({}, { onSuccess: () => setApproveOpen(false) })}
              disabled={approveMinute.isPending}>
              {approveMinute.isPending ? 'Aprovando...' : 'Confirmar Aprovação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit approved version dialog */}
      <Dialog open={editApprovedOpen} onOpenChange={setEditApprovedOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Criar Nova Versão</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={editApprovedForm.handleSubmit((v) =>
              editApproved.mutate(v, { onSuccess: () => setEditApprovedOpen(false) })
            )}
            className="space-y-4">
            <div className="space-y-1">
              <Label>Conteúdo *</Label>
              <Controller
                control={editApprovedForm.control}
                name="content"
                render={({ field }) => (
                  <RichTextEditor value={field.value} onChange={field.onChange} />
                )}
              />
              {editApprovedForm.formState.errors.content && (
                <p className="text-xs text-red-500">
                  {editApprovedForm.formState.errors.content.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="ea-reason">Motivo da alteração *</Label>
              <Input id="ea-reason" {...editApprovedForm.register('reasonForChange')} />
              {editApprovedForm.formState.errors.reasonForChange && (
                <p className="text-xs text-red-500">
                  {editApprovedForm.formState.errors.reasonForChange.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditApprovedOpen(false)}
                disabled={editApproved.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={editApproved.isPending}>
                {editApproved.isPending ? 'Salvando...' : 'Salvar Nova Versão'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface EditPendingDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentContent: string;
  onSubmit: (content: string) => void;
  isPending: boolean;
}

function EditPendingDialog({
  open,
  onOpenChange,
  currentContent,
  onSubmit,
  isPending
}: EditPendingDialogProps) {
  const { handleSubmit, reset, control } = useForm<{ content: string }>({
    defaultValues: { content: currentContent }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) reset({ content: currentContent });
        onOpenChange(v);
      }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Rascunho</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => onSubmit(v.content))} className="space-y-4">
          <div className="space-y-1">
            <Label>Conteúdo</Label>
            <Controller
              control={control}
              name="content"
              render={({ field }) => (
                <RichTextEditor value={field.value} onChange={field.onChange} />
              )}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
