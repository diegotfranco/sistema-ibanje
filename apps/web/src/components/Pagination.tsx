// Project wrapper around shadcn's Pagination primitives.
//
// Compact ghost-icon pager: chevrons + "X / Y" label. Native onClick + disabled
// via Button. Always import from '@/components/Pagination' (not '@/components/ui/pagination').
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
      <PaginationContent className="gap-1">
        <PaginationItem>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!canGoPrev}
            aria-label="Página anterior">
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
        </PaginationItem>
        <PaginationItem>
          <span className="px-2 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
            {currentPage} / {totalPages}
          </span>
        </PaginationItem>
        <PaginationItem>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!canGoNext}
            aria-label="Próxima página">
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </PaginationRoot>
  );
}
