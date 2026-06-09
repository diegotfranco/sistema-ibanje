import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/Button';

interface Props {
  viewingTrash: boolean;
  onToggle: (viewingTrash: boolean) => void;
  className?: string;
}

// Flips a reference-data list between its live rows and its "Lixeira" (soft-deleted rows).
// In trash mode the page swaps create/edit/delete for a single Restaurar action.
export function TrashToggle({ viewingTrash, onToggle, className }: Props) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => onToggle(!viewingTrash)}
      className={className}>
      {viewingTrash ? (
        <>
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </>
      ) : (
        <>
          <Trash2 className="h-4 w-4" />
          Lixeira
        </>
      )}
    </Button>
  );
}
