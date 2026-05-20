import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zodResolver';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
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
import StatusBadge from '@/components/StatusBadge';
import { RichTextDisplay, interpolateTipTapDoc, type TipTapDoc } from '@/components/RichTextEditor';
import { MinuteStatus } from '@sistema-ibanje/shared';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { useMinuteById, useUpdatePendingVersion, useUpdateMinute } from './useMinutes';
import { UpdateMinuteSchema, type UpdateMinuteValues, type MinuteVersionResponse } from './schema';
import MinuteApprovalSection from './MinuteApprovalSection';
import MinuteEditApprovedForm from './MinuteEditApprovedForm';
import EditPendingDialog from './EditPendingDialog';
import AttendersPresentsCard from './AttendersPresentsCard';

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
  const updateMinute = useUpdateMinute(minuteId);

  const [editPendingOpen, setEditPendingOpen] = useState(false);
  const [editDetailsOpen, setEditDetailsOpen] = useState(false);
  const [editApprovedOpen, setEditApprovedOpen] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<MinuteVersionResponse | null>(null);

  const editDetailsForm = useForm<UpdateMinuteValues>({
    resolver: zodResolver(UpdateMinuteSchema),
    defaultValues: {
      presidingPastorName: '',
      secretaryName: '',
      openingTime: '',
      closingTime: ''
    }
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
        <span className="text-base font-medium text-muted-foreground">{minute.minuteNumber}</span>
        {current && <StatusBadge status={current.status} />}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Detalhes da Reunião</CardTitle>
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                editDetailsForm.reset({
                  presidingPastorName: minute.presidingPastorName ?? '',
                  secretaryName: minute.secretaryName ?? '',
                  openingTime: minute.openingTime ?? '',
                  closingTime: minute.closingTime ?? ''
                });
                setEditDetailsOpen(true);
              }}>
              Editar Detalhes
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground font-medium">Pastor Presidente</p>
            <p>{minute.presidingPastorName ?? '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground font-medium">Secretário</p>
            <p>{minute.secretaryName ?? '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground font-medium">Hora de Abertura</p>
            <p>{minute.openingTime ?? '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground font-medium">Hora de Encerramento</p>
            <p>{minute.closingTime ?? '—'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conteúdo</CardTitle>
        </CardHeader>
        <CardContent>
          {current ? (
            <RichTextDisplay
              content={
                interpolateTipTapDoc(current.content, {
                  minute_number: minute.minuteNumber ?? '',
                  presiding_pastor_name: minute.presidingPastorName ?? '',
                  secretary_name: minute.secretaryName ?? '',
                  opening_time: minute.openingTime ?? '',
                  closing_time: minute.closingTime ?? '',
                  members_present_count: String(minute.attendersPresent.length),
                  pautas: minute.pautas
                }) as TipTapDoc
              }
              className="text-sm"
            />
          ) : (
            <p className="text-muted-foreground text-sm">Sem conteúdo.</p>
          )}

          {current && (
            <div className="flex gap-2 mt-4 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => setPdfPreviewOpen(true)}>
                Visualizar PDF
              </Button>
              {current.status === MinuteStatus.Draft && canEdit && (
                <>
                  <Button size="sm" variant="outline" onClick={() => setEditPendingOpen(true)}>
                    Editar Rascunho
                  </Button>
                </>
              )}
              {current.status === MinuteStatus.AwaitingApproval && canEdit && (
                <Button size="sm" variant="outline" onClick={() => setEditPendingOpen(true)}>
                  Editar Rascunho
                </Button>
              )}
              {current.status === MinuteStatus.Approved && canEdit && (
                <Button size="sm" variant="outline" onClick={() => setEditApprovedOpen(true)}>
                  Criar Nova Versão
                </Button>
              )}
              <MinuteApprovalSection
                minuteId={minuteId}
                currentStatus={current.status}
                canEdit={canEdit}
                canReview={canReview}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <AttendersPresentsCard meetingId={minute.meetingId} canEdit={canEdit} />

      <Card>
        <CardHeader>
          <CardTitle>Documento Assinado</CardTitle>
        </CardHeader>
        <CardContent>
          {minute.hasSignedDocument ? (
            <iframe
              src={`${import.meta.env.VITE_API_URL || '/api'}/minutes/${minuteId}/signed-document`}
              className="w-full h-96 border rounded"
              title="Documento assinado"
            />
          ) : (
            <p className="text-muted-foreground text-sm">Nenhum documento assinado enviado.</p>
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
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedVersions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Sem versões.
                  </TableCell>
                </TableRow>
              )}
              {sortedVersions.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>v{v.version}</TableCell>
                  <TableCell>
                    <StatusBadge status={v.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {v.reasonForChange ?? '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(v.createdAt)}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedVersion(v)}
                      aria-label="Visualizar versão">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
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
        currentContent={(current?.content as TipTapDoc | undefined) ?? null}
        onSubmit={(content) =>
          updatePending.mutate({ content }, { onSuccess: () => setEditPendingOpen(false) })
        }
        isPending={updatePending.isPending}
      />

      {/* Edit details dialog */}
      <Dialog open={editDetailsOpen} onOpenChange={setEditDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Detalhes</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={editDetailsForm.handleSubmit((v) =>
              updateMinute.mutate(v, { onSuccess: () => setEditDetailsOpen(false) })
            )}
            className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="ed-presidingPastorName">Pastor Presidente</Label>
                <Input
                  id="ed-presidingPastorName"
                  {...editDetailsForm.register('presidingPastorName')}
                />
                {editDetailsForm.formState.errors.presidingPastorName && (
                  <p className="text-xs text-destructive">
                    {editDetailsForm.formState.errors.presidingPastorName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="ed-secretaryName">Secretário</Label>
                <Input id="ed-secretaryName" {...editDetailsForm.register('secretaryName')} />
                {editDetailsForm.formState.errors.secretaryName && (
                  <p className="text-xs text-destructive">
                    {editDetailsForm.formState.errors.secretaryName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="ed-openingTime">Hora de Abertura</Label>
                <Input
                  type="time"
                  id="ed-openingTime"
                  {...editDetailsForm.register('openingTime')}
                />
                {editDetailsForm.formState.errors.openingTime && (
                  <p className="text-xs text-destructive">
                    {editDetailsForm.formState.errors.openingTime.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="ed-closingTime">Hora de Encerramento</Label>
                <Input
                  type="time"
                  id="ed-closingTime"
                  {...editDetailsForm.register('closingTime')}
                />
                {editDetailsForm.formState.errors.closingTime && (
                  <p className="text-xs text-destructive">
                    {editDetailsForm.formState.errors.closingTime.message}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDetailsOpen(false)}
                disabled={updateMinute.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMinute.isPending}>
                {updateMinute.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit approved version dialog */}
      <MinuteEditApprovedForm
        minuteId={minuteId}
        open={editApprovedOpen}
        onOpenChange={setEditApprovedOpen}
        currentContent={(current?.content as TipTapDoc) ?? null}
      />

      {/* PDF preview dialog */}
      <Dialog open={pdfPreviewOpen} onOpenChange={setPdfPreviewOpen}>
        <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Pré-visualização — {minute.minuteNumber}</DialogTitle>
          </DialogHeader>
          <iframe
            src={`${import.meta.env.VITE_API_URL || '/api'}/minutes/${minuteId}/pdf`}
            className="flex-1 border rounded"
            title="PDF da ata"
          />
          <DialogFooter>
            <a
              href={`${import.meta.env.VITE_API_URL || '/api'}/minutes/${minuteId}/pdf?download=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 h-9">
              Baixar PDF
            </a>
            <Button variant="outline" onClick={() => setPdfPreviewOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version viewer dialog */}
      <Dialog open={!!selectedVersion} onOpenChange={(open) => !open && setSelectedVersion(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Versão v{selectedVersion?.version} — {selectedVersion?.status}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-4">
            {selectedVersion && (
              <RichTextDisplay
                content={
                  interpolateTipTapDoc(selectedVersion.content, {
                    minute_number: minute.minuteNumber ?? '',
                    presiding_pastor_name: minute.presidingPastorName ?? '',
                    secretary_name: minute.secretaryName ?? '',
                    opening_time: minute.openingTime ?? '',
                    closing_time: minute.closingTime ?? '',
                    members_present_count: String(minute.attendersPresent.length),
                    pautas: minute.pautas
                  }) as TipTapDoc
                }
                className="text-sm"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedVersion(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
