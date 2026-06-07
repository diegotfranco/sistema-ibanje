import * as React from 'react';
import { toast } from 'sonner';
import { Paperclip, X } from 'lucide-react';
import { Button } from '@/components/Button';

interface Props {
  entryId?: number;
  hasReceipt: boolean;
  stagedFile: File | null;
  stagedRemoval: boolean;
  onStage: (file: File | null) => void;
  onStageRemoval: (remove: boolean) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ReceiptField({
  entryId,
  hasReceipt,
  stagedFile,
  stagedRemoval,
  onStage,
  onStageRemoval
}: Props) {
  const receiptUrl = `${import.meta.env.VITE_API_URL || '/api'}/expense-entries/${entryId}/receipt`;
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5 MB.');
      return;
    }
    onStage(file);
  };

  const openPicker = () => fileRef.current?.click();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {stagedFile ? (
        <>
          <span className="inline-flex items-center gap-2 rounded-md border bg-muted/30 px-2 py-1 text-sm">
            <Paperclip size={14} className="text-muted-foreground" />
            <span className="font-medium">{stagedFile.name}</span>
            <span className="text-muted-foreground">· {formatBytes(stagedFile.size)}</span>
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={() => onStage(null)}>
            <X size={14} className="mr-1" />
            {hasReceipt ? 'Cancelar troca' : 'Remover'}
          </Button>
        </>
      ) : stagedRemoval ? (
        <>
          <span className="text-sm text-muted-foreground italic">Remoção pendente</span>
          <Button type="button" variant="ghost" size="sm" onClick={() => onStageRemoval(false)}>
            Cancelar
          </Button>
        </>
      ) : hasReceipt ? (
        <>
          <Button type="button" variant="outline" size="sm" asChild>
            <a href={receiptUrl} target="_blank" rel="noopener noreferrer">
              Ver comprovante
            </a>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={openPicker}>
            Substituir
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive/80"
            onClick={() => onStageRemoval(true)}>
            Remover
          </Button>
        </>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={openPicker}>
          Anexar comprovante
        </Button>
      )}
    </div>
  );
}
