import * as React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useUploadReceipt, useDeleteReceipt } from './useExpenseEntries';

interface Props {
  entryId: number;
  receipt: string | null;
}

export function ReceiptField({ entryId, receipt }: Props) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const upload = useUploadReceipt();
  const deleteReceipt = useDeleteReceipt();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5 MB.');
      e.target.value = '';
      return;
    }
    upload.mutate({ id: entryId, file });
    e.target.value = '';
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      {receipt ? (
        <>
          <Button type="button" variant="outline" size="sm" asChild>
            <a href={receipt} target="_blank" rel="noopener noreferrer">
              Ver comprovante
            </a>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={() => deleteReceipt.mutate(entryId)}
            disabled={deleteReceipt.isPending}>
            {deleteReceipt.isPending ? 'Removendo...' : 'Remover'}
          </Button>
        </>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={upload.isPending}>
          {upload.isPending ? 'Enviando...' : 'Anexar comprovante'}
        </Button>
      )}
    </div>
  );
}
