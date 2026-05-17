import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoPrev}
        className="gap-1">
        <ChevronLeft className="h-4 w-4" />
        Anterior
      </Button>

      <span className="text-sm text-muted-foreground">
        Página {currentPage} de {totalPages}
      </span>

      <Button
        size="sm"
        variant="outline"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        className="gap-1">
        Próxima
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
