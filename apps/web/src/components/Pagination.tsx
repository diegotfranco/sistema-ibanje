// Project wrapper around shadcn's Pagination primitives.
//
// Why this exists: callers want a simple controlled pager — currentPage,
// totalPages, onPageChange — with pt-BR labels. The shadcn primitives compose a
// link-style pager; this wrapper renders Previous/Next as proper Buttons (so
// onClick + disabled work natively) inside the Pagination nav structure, so
// future `shadcn add pagination` re-syncs are mechanical.
//
// Always import from '@/components/Pagination' (not '@/components/ui/pagination').
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/Button';
import {
  Pagination as PaginationRoot,
  PaginationContent,
  PaginationItem
} from '@/components/ui/pagination';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <PaginationRoot>
      <PaginationContent>
        <PaginationItem>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!canGoPrev}>
            <ChevronLeftIcon data-icon="inline-start" />
            <span className="hidden sm:inline">Anterior</span>
          </Button>
        </PaginationItem>
        <PaginationItem>
          <span className="whitespace-nowrap px-3 text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
        </PaginationItem>
        <PaginationItem>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!canGoNext}>
            <span className="hidden sm:inline">Próxima</span>
            <ChevronRightIcon data-icon="inline-end" />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </PaginationRoot>
  );
}
