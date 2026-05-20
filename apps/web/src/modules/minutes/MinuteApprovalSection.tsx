import { useState } from 'react';
import { Button } from '@/components/Button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MinuteStatus } from '@sistema-ibanje/shared';
import { useApproveMinute, useFinalizeDraft, useSignMinute } from './useMinutes';

interface MinuteApprovalSectionProps {
  minuteId: number;
  currentStatus: string | undefined;
  canEdit: boolean;
  canReview: boolean;
  onApproveSuccess?: () => void;
  onFinalizeSuccess?: () => void;
  onSignSuccess?: () => void;
}

export default function MinuteApprovalSection({
  minuteId,
  currentStatus,
  canEdit,
  canReview,
  onApproveSuccess,
  onFinalizeSuccess,
  onSignSuccess
}: MinuteApprovalSectionProps) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [finalizeDraftOpen, setFinalizeDraftOpen] = useState(false);
  const [uploadDocumentOpen, setUploadDocumentOpen] = useState(false);

  const approveMinute = useApproveMinute(minuteId);
  const finalizeDraft = useFinalizeDraft(minuteId);
  const signMinute = useSignMinute(minuteId);

  return (
    <>
      {currentStatus === MinuteStatus.AwaitingApproval && canReview && (
        <Button size="sm" onClick={() => setApproveOpen(true)} className="mr-2">
          Aprovar
        </Button>
      )}

      {currentStatus === MinuteStatus.Draft && canEdit && (
        <Button size="sm" onClick={() => setFinalizeDraftOpen(true)}>
          Finalizar Rascunho
        </Button>
      )}

      {(currentStatus === MinuteStatus.Approved ||
        currentStatus === MinuteStatus.AwaitingApproval) &&
        canEdit && (
          <Button size="sm" variant="outline" onClick={() => setUploadDocumentOpen(true)}>
            {currentStatus === MinuteStatus.Approved
              ? 'Substituir Documento'
              : 'Enviar PDF Assinado'}
          </Button>
        )}

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
              onClick={() =>
                approveMinute.mutate(
                  {},
                  {
                    onSuccess: () => {
                      setApproveOpen(false);
                      onApproveSuccess?.();
                    }
                  }
                )
              }
              disabled={approveMinute.isPending}>
              {approveMinute.isPending ? 'Aprovando...' : 'Confirmar Aprovação'}
            </Button>
          </DialogFooter>
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
                finalizeDraft.mutate(undefined, {
                  onSuccess: () => {
                    setFinalizeDraftOpen(false);
                    onFinalizeSuccess?.();
                  }
                })
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
          signMinute.mutate(file, {
            onSuccess: () => {
              setUploadDocumentOpen(false);
              onSignSuccess?.();
            }
          })
        }
        isPending={signMinute.isPending}
      />
    </>
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
