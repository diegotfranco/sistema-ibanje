import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, X, Eye } from 'lucide-react';
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
import StatusBadge from '@/components/StatusBadge';
import {
  RichTextDisplay,
  RichTextEditor,
  interpolateTipTapDoc,
  EMPTY_TIPTAP_DOC,
  type TipTapDoc
} from '@/components/ui/rich-text-editor';
import { MinuteStatus } from '@sistema-ibanje/shared';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import {
  useMinuteById,
  useUpdatePendingVersion,
  useEditApprovedMinute,
  useApproveMinute,
  useFinalizeDraft,
  useUpdateMinute,
  useSignMinute,
  useMeetingAttendersPresent,
  useSetMeetingAttendersPresent
} from './useMinutes';
import { useAttenders } from '@/modules/attenders/useAttenders';
import {
  EditApprovedMinuteSchema,
  UpdateMinuteSchema,
  type EditApprovedMinuteValues,
  type UpdateMinuteValues,
  type MinuteVersionResponse
} from '@/schemas/minute';

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
  const finalizeDraft = useFinalizeDraft(minuteId);
  const updateMinute = useUpdateMinute(minuteId);
  const signMinute = useSignMinute(minuteId);

  const [editPendingOpen, setEditPendingOpen] = useState(false);
  const [editDetailsOpen, setEditDetailsOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [editApprovedOpen, setEditApprovedOpen] = useState(false);
  const [finalizeDraftOpen, setFinalizeDraftOpen] = useState(false);
  const [uploadDocumentOpen, setUploadDocumentOpen] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<MinuteVersionResponse | null>(null);

  const editApprovedForm = useForm<EditApprovedMinuteValues>({
    resolver: zodResolver(EditApprovedMinuteSchema),
    defaultValues: { content: EMPTY_TIPTAP_DOC, reasonForChange: '' }
  });

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
        <div>
          <h1 className="text-2xl font-semibold">{minute.minuteNumber}</h1>
          {current && <StatusBadge status={current.status} className="mt-1" />}
        </div>
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
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline" onClick={() => setPdfPreviewOpen(true)}>
                Visualizar PDF
              </Button>
              {current.status === MinuteStatus.Draft && canEdit && (
                <>
                  <Button size="sm" variant="outline" onClick={() => setEditPendingOpen(true)}>
                    Editar Rascunho
                  </Button>
                  <Button size="sm" onClick={() => setFinalizeDraftOpen(true)}>
                    Finalizar Rascunho
                  </Button>
                </>
              )}
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
                    editApprovedForm.reset({
                      content: (current.content as TipTapDoc) ?? EMPTY_TIPTAP_DOC,
                      reasonForChange: ''
                    });
                    setEditApprovedOpen(true);
                  }}>
                  Criar Nova Versão
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AttendersPresentsCard meetingId={minute.meetingId} canEdit={canEdit} />

      {minute.signedDocumentPath && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Documento Assinado</CardTitle>
            {canEdit && (
              <Button size="sm" variant="outline" onClick={() => setUploadDocumentOpen(true)}>
                Substituir Documento
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <iframe
              src={minute.signedDocumentPath}
              className="w-full h-96 border rounded"
              title="Documento assinado"
            />
          </CardContent>
        </Card>
      )}

      {!minute.signedDocumentPath && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Documento Assinado</CardTitle>
            {canEdit && (
              <Button size="sm" onClick={() => setUploadDocumentOpen(true)}>
                Enviar PDF Assinado
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Nenhum documento assinado enviado.</p>
          </CardContent>
        </Card>
      )}

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
                  <RichTextEditor value={field.value as TipTapDoc} onChange={field.onChange} />
                )}
              />
              {editApprovedForm.formState.errors.content && (
                <p className="text-xs text-destructive">
                  {editApprovedForm.formState.errors.content.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="ea-reason">Motivo da alteração *</Label>
              <Input id="ea-reason" {...editApprovedForm.register('reasonForChange')} />
              {editApprovedForm.formState.errors.reasonForChange && (
                <p className="text-xs text-destructive">
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

      {/* Finalize draft dialog */}
      <Dialog open={finalizeDraftOpen} onOpenChange={setFinalizeDraftOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizar Rascunho</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Finalizar o rascunho? Após finalização, a ata seguirá para aprovação e o rascunho não
            poderá mais ser editado livremente.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFinalizeDraftOpen(false)}
              disabled={finalizeDraft.isPending}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                finalizeDraft.mutate(undefined, { onSuccess: () => setFinalizeDraftOpen(false) })
              }
              disabled={finalizeDraft.isPending}>
              {finalizeDraft.isPending ? 'Finalizando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload document dialog */}
      <UploadDocumentDialog
        open={uploadDocumentOpen}
        onOpenChange={setUploadDocumentOpen}
        onSubmit={(file) =>
          signMinute.mutate(file, { onSuccess: () => setUploadDocumentOpen(false) })
        }
        isPending={signMinute.isPending}
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

interface EditPendingDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentContent: TipTapDoc | null;
  onSubmit: (content: TipTapDoc) => void;
  isPending: boolean;
}

function EditPendingDialog({
  open,
  onOpenChange,
  currentContent,
  onSubmit,
  isPending
}: EditPendingDialogProps) {
  const { handleSubmit, reset, control } = useForm<{ content: TipTapDoc }>({
    defaultValues: { content: currentContent ?? EMPTY_TIPTAP_DOC }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) reset({ content: currentContent ?? EMPTY_TIPTAP_DOC });
        onOpenChange(v);
      }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Rascunho</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((v) => onSubmit(v.content as TipTapDoc))}
          className="space-y-4">
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

interface AttendersPresentsCardProps {
  meetingId: number;
  canEdit: boolean;
}

function AttendersPresentsCard({ meetingId, canEdit }: AttendersPresentsCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const { data: attendersList } = useAttenders();
  const { data: presentData } = useMeetingAttendersPresent(meetingId);
  const setPresent = useSetMeetingAttendersPresent(meetingId);

  const presentIds = new Set(presentData?.data?.map((a) => a.id) ?? []);
  const presentNames = presentData?.data?.map((a) => a.name) ?? [];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Membros Presentes</CardTitle>
          {canEdit && (
            <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
              Editar Membros Presentes
            </Button>
          )}
        </CardHeader>
        <CardContent className="text-sm">
          {presentNames.length === 0 ? (
            <p className="text-muted-foreground">Nenhum membro presentes registrado.</p>
          ) : (
            <ul className="space-y-1">
              {presentNames.map((name) => (
                <li key={name} className="flex items-center">
                  {name}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <EditAttendersDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        selectedIds={Array.from(presentIds)}
        availableAttenders={(attendersList?.data ?? []).filter(
          (a) => a.isMember && a.status === 'ativo'
        )}
        onSubmit={(ids) => setPresent.mutate(ids, { onSuccess: () => setEditOpen(false) })}
        isPending={setPresent.isPending}
      />
    </>
  );
}

interface EditAttendersDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selectedIds: number[];
  availableAttenders: { id: number; name: string }[];
  onSubmit: (ids: number[]) => void;
  isPending: boolean;
}

function EditAttendersDialog({
  open,
  onOpenChange,
  selectedIds,
  availableAttenders,
  onSubmit,
  isPending
}: EditAttendersDialogProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set(selectedIds));
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAttenders = availableAttenders.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    onSubmit(Array.from(selected));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Membros Presentes</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="search">Buscar Membro</Label>
            <Input
              id="search"
              placeholder="Digite o nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto border rounded p-2">
            {filteredAttenders.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum membro encontrado.</p>
            ) : (
              filteredAttenders.map((attender) => (
                <div
                  key={attender.id}
                  className="flex items-center gap-2 p-1 rounded hover:bg-muted cursor-pointer"
                  onClick={() => handleToggle(attender.id)}>
                  <input
                    type="checkbox"
                    checked={selected.has(attender.id)}
                    onChange={() => {}}
                    className="cursor-pointer"
                  />
                  <label className="flex-1 cursor-pointer text-sm">{attender.name}</label>
                </div>
              ))
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {Array.from(selected)
              .map((id) => availableAttenders.find((a) => a.id === id))
              .filter((a): a is { id: number; name: string } => Boolean(a))
              .map((attender) => (
                <div
                  key={attender.id}
                  className="flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
                  {attender.name}
                  <button
                    onClick={() => handleToggle(attender.id)}
                    className="ml-1 font-bold hover:opacity-80">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (file: File) => void;
  isPending: boolean;
}

function UploadDocumentDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending
}: UploadDocumentDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = () => {
    if (selectedFile) {
      onSubmit(selectedFile);
      setSelectedFile(null);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setSelectedFile(null);
        onOpenChange(v);
      }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar PDF Assinado</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="pdf-file">Arquivo PDF *</Label>
            <Input
              id="pdf-file"
              type="file"
              accept="application/pdf"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            />
            {selectedFile && <p className="text-xs text-muted-foreground">{selectedFile.name}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedFile || isPending}>
            {isPending ? 'Enviando...' : 'Enviar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
