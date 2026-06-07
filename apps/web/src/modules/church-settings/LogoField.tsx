import * as React from 'react';
import { toast } from 'sonner';
import { Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/Button';
import { useUploadLogo, useDeleteLogo } from './useChurchSettings';

interface Props {
  logoPath: string | null;
  // updatedAt timestamp — appended to the preview URL to bust the browser cache
  // after an upload/replace, since the logo endpoint URL is otherwise stable.
  version: string;
}

export function LogoField({ logoPath, version }: Props) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadLogo();
  const deleteMutation = useDeleteLogo();
  const busy = uploadMutation.isPending || deleteMutation.isPending;

  const logoUrl = `${import.meta.env.VITE_API_URL || '/api'}/church-settings/logo?v=${encodeURIComponent(version)}`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      toast.error('Use uma imagem PNG ou JPEG.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5 MB.');
      return;
    }
    uploadMutation.mutate(file);
  };

  const openPicker = () => fileRef.current?.click();

  return (
    <div className="flex flex-wrap items-center gap-4">
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={handleFileChange}
      />

      {logoPath ? (
        <img
          src={logoUrl}
          alt="Logo da igreja"
          className="h-16 w-16 rounded border bg-muted/30 object-contain"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded border border-dashed text-muted-foreground">
          <ImageIcon size={20} />
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={openPicker} disabled={busy}>
          {logoPath ? 'Substituir' : 'Enviar logo'}
        </Button>
        {logoPath ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive/80"
            onClick={() => deleteMutation.mutate()}
            disabled={busy}>
            <X size={14} className="mr-1" />
            Remover
          </Button>
        ) : null}
      </div>
    </div>
  );
}
