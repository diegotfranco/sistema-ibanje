import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useRenderedMembershipLetter } from './useMembershipLetters';

interface Props {
  letterId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MembershipLetterPreviewDialog({ letterId, open, onOpenChange }: Props) {
  const { data: html, isLoading } = useRenderedMembershipLetter(letterId, open);

  const handlePrint = () => {
    const iframe = document.querySelector(
      'iframe[data-membership-letter-preview]'
    ) as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.print();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Visualizar Carta de Transferência</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : html ? (
          <iframe
            data-membership-letter-preview
            sandbox={{ toString: () => 'allow-same-origin' } as never}
            srcDoc={html}
            className="w-full h-[70vh] border rounded-md"
          />
        ) : (
          <div className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">Erro ao carregar carta.</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={handlePrint} disabled={isLoading || !html}>
            Imprimir / Salvar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
