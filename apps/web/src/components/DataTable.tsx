import type { ColumnDef } from '@tanstack/react-table';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { type Breakpoint, useIsAbove } from '@/hooks/useBreakpoint';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

declare module '@tanstack/react-table' {
  // Generic params mirror the upstream signature so the augmentation merges; phantom field uses them.
  interface ColumnMeta<TData, TValue> {
    hideBelow?: Breakpoint;
    align?: 'left' | 'right' | 'center';
    __augmentationPhantom?: [TData, TValue];
  }
}

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  isLoading?: boolean;
  emptyMessage?: string;
  skeletonRows?: number;
  getRowKey?: (row: TData, index: number) => string | number;
}

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'Nenhum registro encontrado.',
  skeletonRows = 5,
  getRowKey
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

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    state: { columnVisibility }
  });

  const visibleColumns = table.getVisibleLeafColumns();

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const meta = header.column.columnDef.meta as unknown as Record<string, unknown>;
              const align = meta?.align as 'left' | 'right' | 'center' | undefined;
              const alignClass =
                align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
              return (
                <TableHead key={header.id} className={alignClass}>
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
            <TableRow key={`skeleton-${idx}`}>
              {visibleColumns.map((col) => (
                <TableCell key={col.id}>
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : data.length === 0 ? (
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
            return (
              <TableRow key={key}>
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta as unknown as Record<string, unknown>;
                  const align = meta?.align as 'left' | 'right' | 'center' | undefined;
                  const alignClass =
                    align === 'right'
                      ? 'text-right'
                      : align === 'center'
                        ? 'text-center'
                        : 'text-left';
                  return (
                    <TableCell key={cell.id} className={alignClass}>
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
