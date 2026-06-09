import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/Button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/Dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selectedIds: number[];
  availableAttenders: { id: number; name: string }[];
  onSubmit: (ids: number[]) => void;
  isPending: boolean;
}

export default function EditAttendersDialog({
  open,
  onOpenChange,
  selectedIds,
  availableAttenders,
  onSubmit,
  isPending
}: Props) {
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
          <DialogTitle>Editar Congregados Presentes</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="search">Buscar Congregado</Label>
            <Input
              id="search"
              placeholder="Digite o nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto border rounded p-2">
            {filteredAttenders.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum congregado encontrado.</p>
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
