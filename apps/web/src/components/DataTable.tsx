import type { ReactNode } from 'react';
import type { ColumnDef, FilterFn } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable
} from '@tanstack/react-table';
import { type Breakpoint, useIsAbove } from '@/hooks/useBreakpoint';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

declare module '@tanstack/react-table' {
  // Generic params mirror the upstream signature so the augmentation merges; phantom field uses them.
  interface ColumnMeta<TData, TValue> {
    hideBelow?: Breakpoint;
    align?: 'left' | 'right' | 'center';
    className?: string;
    __augmentationPhantom?: [TData, TValue];
  }
}

// Project-level table styling. Lives here (not in ui/table.tsx) so the
// shadcn primitive stays pristine and future `shadcn add table` won't clobber it.
const HEADER_STRIP = '';
const HEAD_CELL = 'h-12 px-3 text-sm font-semibold text-foreground';
const BODY_ROW_ZEBRA = 'odd:bg-muted/60 hover:bg-muted/40 odd:hover:bg-muted/70';
const BODY_CELL = 'px-3 py-2';

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  isLoading?: boolean;
  emptyMessage?: string;
  skeletonRows?: number;
  getRowKey?: (row: TData, index: number) => string | number;
  isSectionHeader?: (row: TData) => boolean;
  renderSectionHeader?: (row: TData) => ReactNode;
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  globalFilterFn?: FilterFn<TData>;
}

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'Nenhum registro encontrado.',
  skeletonRows = 5,
  getRowKey,
  isSectionHeader,
  renderSectionHeader,
  globalFilter,
  onGlobalFilterChange,
  globalFilterFn
}: DataTableProps<TData>) {
  // Call all four breakpoints unconditionally (rules of hooks)
  const isAboveSm = useIsAbove('sm');
  const isAboveMd = useIsAbove('md');
  const isAboveLg = useIsAbove('lg');
  const isAboveXl = useIsAbove('xl');

  const breakpointMap: Record<Breakpoint, boolean> = {
    sm: isAboveSm,
    md: isAboveMd,
    lg: isAboveLg,
    xl: isAboveXl
  };

  // Compute column visibility
  const columnVisibility: Record<string, boolean> = {};
  columns.forEach((col) => {
    const meta = (col.meta as unknown as Record<string, unknown>) || {};
    const hideBelow = meta.hideBelow as Breakpoint | undefined;
    if (hideBelow) {
      columnVisibility[col.id || ''] = breakpointMap[hideBelow];
    } else {
      columnVisibility[col.id || ''] = true;
    }
  });

  const filterEnabled = globalFilter !== undefined;
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    ...(filterEnabled && { getFilteredRowModel: getFilteredRowModel() }),
    ...(filterEnabled && globalFilterFn ? { globalFilterFn } : {}),
    ...(onGlobalFilterChange && {
      onGlobalFilterChange: (updater) => {
        const next =
          typeof updater === 'function'
            ? (updater as (old: string) => string)(globalFilter ?? '')
            : (updater as string);
        onGlobalFilterChange(next);
      }
    }),
    state: { columnVisibility, ...(filterEnabled && { globalFilter }) }
  });

  const visibleColumns = table.getVisibleLeafColumns();

  return (
    <Table>
      <TableHeader className={HEADER_STRIP}>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className="hover:bg-transparent">
            {headerGroup.headers.map((header) => {
              const meta = header.column.columnDef.meta as unknown as Record<string, unknown>;
              const align = meta?.align as 'left' | 'right' | 'center' | undefined;
              const extraClass = meta?.className as string | undefined;
              const alignClass =
                align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
              return (
                <TableHead key={header.id} className={cn(HEAD_CELL, alignClass, extraClass)}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {isLoading ? (
          Array.from({ length: skeletonRows }).map((_, idx) => (
            <TableRow key={`skeleton-${idx}`} className={BODY_ROW_ZEBRA}>
              {visibleColumns.map((col) => (
                <TableCell key={col.id} className={BODY_CELL}>
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : table.getRowModel().rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={visibleColumns.length}
              className="py-8 text-center text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          table.getRowModel().rows.map((row, idx) => {
            const key: React.Key =
              (getRowKey?.(row.original, idx) as React.Key) ??
              ((row.original as unknown as Record<string, unknown>).id as React.Key) ??
              idx;
            if (isSectionHeader?.(row.original)) {
              return (
                <TableRow key={key} className="bg-muted/50 border-y hover:bg-muted/50">
                  <TableCell colSpan={visibleColumns.length} className="px-3 py-2">
                    {renderSectionHeader?.(row.original)}
                  </TableCell>
                </TableRow>
              );
            }
            return (
              <TableRow key={key} className={BODY_ROW_ZEBRA}>
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta as unknown as Record<string, unknown>;
                  const align = meta?.align as 'left' | 'right' | 'center' | undefined;
                  const extraClass = meta?.className as string | undefined;
                  const alignClass =
                    align === 'right'
                      ? 'text-right'
                      : align === 'center'
                        ? 'text-center'
                        : 'text-left';
                  return (
                    <TableCell key={cell.id} className={cn(BODY_CELL, alignClass, extraClass)}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
