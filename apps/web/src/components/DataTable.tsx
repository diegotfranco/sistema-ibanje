import { useEffect, useState, type ReactNode } from 'react';
import type { ColumnDef, FilterFn, VisibilityState } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable
} from '@tanstack/react-table';
import { Loader2, Search, SlidersHorizontal } from 'lucide-react';
import { type Breakpoint, useIsAbove } from '@/hooks/useBreakpoint';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/Button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/DropdownMenu';
import { TableFilter, type TableFilterOption } from '@/components/TableFilter';
import { cn } from '@/lib/utils';

declare module '@tanstack/react-table' {
  // Generic params mirror the upstream signature so the augmentation merges; phantom field uses them.
  interface ColumnMeta<TData, TValue> {
    hideBelow?: Breakpoint;
    align?: 'left' | 'right' | 'center';
    className?: string;
    label?: string;
    canHide?: boolean;
    filter?: { options: TableFilterOption[]; label?: string; allLabel?: string };
    __augmentationPhantom?: [TData, TValue];
  }
}

// Project-level table styling. Lives here (not in ui/table.tsx) so the
// shadcn primitive stays pristine and future `shadcn add table` won't clobber it.
const HEADER_STRIP = 'bg-muted/60';
const HEAD_CELL = 'h-12 px-3 text-sm font-semibold text-primary-soft';
const BODY_ROW_TINTED = 'bg-muted/30 hover:bg-muted/50';
const BODY_ROW_PLAIN = 'hover:bg-muted/30';
const BODY_CELL = 'px-3 py-2';

export type DataTableSearchable = boolean | { placeholder?: string; loading?: boolean };

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
  mobileRow?: (row: TData) => ReactNode;
  mobileSectionHeader?: (row: TData) => ReactNode;
  mobileOnRowClick?: (row: TData) => void;
  disableZebra?: boolean;
  /** Show a search input in the toolbar (desktop only). */
  searchable?: DataTableSearchable;
  /** Show a "Colunas" dropdown to toggle per-column visibility (desktop only). */
  columnToggle?: boolean;
  /**
   * Stable identifier used to persist column-visibility choices in localStorage.
   * Required for `columnToggle` persistence; if absent, choices live only for the session.
   */
  tableId?: string;
  /** Extra slot rendered on the right side of the toolbar (e.g. a "+ New" button). */
  toolbarRight?: ReactNode;
  /**
   * Current filter values keyed by column id. A column declares filterability
   * via `meta.filter = { options: [...] }`; DataTable then renders a TableFilter
   * for each, sourcing its current value from this map and emitting changes via
   * `onFilterChange(columnId, value)`. Use `undefined` for the "all" state.
   * Filters are applied server-side by the caller (page owns the query state).
   */
  filters?: Record<string, string | undefined>;
  onFilterChange?: (columnId: string, value: string | undefined) => void;
}

const COL_VISIBILITY_STORAGE_PREFIX = 'datatable:cols:';

function loadStoredVisibility(tableId: string | undefined): VisibilityState {
  if (!tableId || typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(`${COL_VISIBILITY_STORAGE_PREFIX}${tableId}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as VisibilityState) : {};
  } catch {
    return {};
  }
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
  globalFilterFn,
  mobileRow,
  mobileSectionHeader,
  mobileOnRowClick,
  disableZebra = false,
  searchable = false,
  columnToggle = false,
  tableId,
  toolbarRight,
  filters,
  onFilterChange
}: DataTableProps<TData>) {
  // Call all breakpoints unconditionally (rules of hooks)
  const isAboveSm = useIsAbove('sm');
  const isAboveMd = useIsAbove('md');
  const isAboveLg = useIsAbove('lg');
  const isAboveXl = useIsAbove('xl');
  const isAbove2xl = useIsAbove('2xl');

  const breakpointMap: Record<Breakpoint, boolean> = {
    sm: isAboveSm,
    md: isAboveMd,
    lg: isAboveLg,
    xl: isAboveXl,
    '2xl': isAbove2xl
  };

  // Auto visibility from `meta.hideBelow`. User overrides (from the column-toggle
  // dropdown) take precedence and are merged on top.
  const autoVisibility: VisibilityState = {};
  columns.forEach((col) => {
    const meta = (col.meta as unknown as Record<string, unknown>) || {};
    const hideBelow = meta.hideBelow as Breakpoint | undefined;
    const id = col.id || '';
    autoVisibility[id] = hideBelow ? breakpointMap[hideBelow] : true;
  });

  const [userVisibility, setUserVisibility] = useState<VisibilityState>(() =>
    loadStoredVisibility(tableId)
  );

  useEffect(() => {
    if (!tableId || typeof window === 'undefined') return;
    if (Object.keys(userVisibility).length === 0) {
      window.localStorage.removeItem(`${COL_VISIBILITY_STORAGE_PREFIX}${tableId}`);
      return;
    }
    window.localStorage.setItem(
      `${COL_VISIBILITY_STORAGE_PREFIX}${tableId}`,
      JSON.stringify(userVisibility)
    );
  }, [tableId, userVisibility]);

  const columnVisibility: VisibilityState = { ...autoVisibility, ...userVisibility };

  // Internalised search state — only used when `searchable` is on and the caller
  // did not provide a controlled `globalFilter`/`onGlobalFilterChange` pair.
  const [internalFilter, setInternalFilter] = useState('');
  const controlledFilter = globalFilter !== undefined;
  const filterValue = controlledFilter ? globalFilter : searchable ? internalFilter : undefined;
  const filterEnabled = filterValue !== undefined;
  const handleFilterChange = (next: string) => {
    if (controlledFilter) onGlobalFilterChange?.(next);
    else setInternalFilter(next);
  };

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    ...(filterEnabled && { getFilteredRowModel: getFilteredRowModel() }),
    ...(filterEnabled && globalFilterFn ? { globalFilterFn } : {}),
    ...(filterEnabled && {
      onGlobalFilterChange: (updater) => {
        const next =
          typeof updater === 'function'
            ? (updater as (old: string) => string)(filterValue ?? '')
            : (updater as string);
        handleFilterChange(next);
      }
    }),
    state: { columnVisibility, ...(filterEnabled && { globalFilter: filterValue }) }
  });

  const visibleColumns = table.getVisibleLeafColumns();

  // Per-item index for zebra striping. Resets at each section header so the
  // first item under any section gets the light shade.
  const rowsForIndex = table.getRowModel().rows;
  const itemIndices: number[] = [];
  let zebraCounter = 0;
  for (const row of rowsForIndex) {
    if (isSectionHeader?.(row.original)) {
      zebraCounter = 0;
      itemIndices.push(-1);
    } else {
      itemIndices.push(zebraCounter);
      zebraCounter += 1;
    }
  }

  const useMobileCards = !!mobileRow && !isAboveMd;
  const searchPlaceholder =
    typeof searchable === 'object' ? (searchable.placeholder ?? 'Buscar...') : 'Buscar...';
  const searchLoading = typeof searchable === 'object' ? !!searchable.loading : false;

  // Columns that declare a filter via `meta.filter`. The parent opts in by
  // passing `onFilterChange`; otherwise the column's filter declaration is
  // silently ignored so pages that don't wire filter state stay clean.
  const filterableColumns = onFilterChange
    ? table.getAllLeafColumns().filter((col) => {
        const meta = col.columnDef.meta as Record<string, unknown> | undefined;
        return !!meta?.filter;
      })
    : [];

  const toolbarVisible =
    isAboveMd && (searchable || columnToggle || toolbarRight || filterableColumns.length > 0);

  // Columns the user is allowed to toggle. Hard-coded exclusions: an "actions"
  // column with no header label, or an explicit `meta.canHide === false`.
  const toggleableColumns = table.getAllLeafColumns().filter((col) => {
    const meta = col.columnDef.meta as Record<string, unknown> | undefined;
    if (meta?.canHide === false) return false;
    if (col.id === 'actions') return false;
    return true;
  });

  const toolbar = toolbarVisible ? (
    <div className="flex items-center justify-between gap-2 px-3 py-2 border-b">
      <div className="flex flex-1 items-center gap-2 min-w-0">
        {searchable && (
          <div className="relative w-full max-w-xs">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              value={filterValue ?? ''}
              onChange={(e) => handleFilterChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-8 pr-8"
            />
            {searchLoading && (
              <Loader2
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin pointer-events-none"
              />
            )}
          </div>
        )}
        {filterableColumns.map((col) => {
          const meta = col.columnDef.meta as Record<string, unknown> | undefined;
          const config = meta?.filter as {
            options: TableFilterOption[];
            label?: string;
            allLabel?: string;
          };
          return (
            <TableFilter
              key={col.id}
              value={filters?.[col.id]}
              onChange={(v) => onFilterChange?.(col.id, v)}
              options={config.options}
              allLabel={config.allLabel}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {columnToggle && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-transparent">
                <SlidersHorizontal size={14} className="mr-1" />
                Colunas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuLabel>Mostrar colunas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {toggleableColumns.map((col) => {
                const meta = col.columnDef.meta as Record<string, unknown> | undefined;
                const label =
                  (meta?.label as string | undefined) ??
                  (typeof col.columnDef.header === 'string'
                    ? (col.columnDef.header as string)
                    : col.id);
                return (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={col.getIsVisible()}
                    onCheckedChange={(value) => {
                      setUserVisibility((prev) => ({ ...prev, [col.id]: !!value }));
                    }}
                    onSelect={(e) => e.preventDefault()}>
                    {label}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {toolbarRight}
      </div>
    </div>
  ) : null;

  if (useMobileCards) {
    if (isLoading) {
      return (
        <ul className="divide-y">
          {Array.from({ length: skeletonRows }).map((_, idx) => (
            <li key={`skeleton-${idx}`} className="px-4 py-3">
              <div className="h-12 animate-pulse rounded bg-muted" />
            </li>
          ))}
        </ul>
      );
    }
    const rows = table.getRowModel().rows;
    if (rows.length === 0) {
      return <p className="px-4 py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
    }
    return (
      <ul className="divide-y">
        {rows.map((row, idx) => {
          const key: React.Key =
            (getRowKey?.(row.original, idx) as React.Key) ??
            ((row.original as unknown as Record<string, unknown>).id as React.Key) ??
            idx;
          if (isSectionHeader?.(row.original)) {
            const headerContent =
              mobileSectionHeader?.(row.original) ?? renderSectionHeader?.(row.original);
            return (
              <li key={key} className="bg-muted/50 border-y px-4 py-2">
                {headerContent}
              </li>
            );
          }
          return (
            <li key={key}>
              {mobileOnRowClick ? (
                <button
                  type="button"
                  onClick={() => mobileOnRowClick(row.original)}
                  className="block w-full text-left px-4 py-3 hover:bg-muted/50 focus-visible:bg-muted/50 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset">
                  {mobileRow!(row.original)}
                </button>
              ) : (
                <div className="px-4 py-3">{mobileRow!(row.original)}</div>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <>
      {toolbar}
      <Table>
        <TableHeader className={HEADER_STRIP}>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                const meta = header.column.columnDef.meta as unknown as Record<string, unknown>;
                const align = meta?.align as 'left' | 'right' | 'center' | undefined;
                const extraClass = meta?.className as string | undefined;
                const alignClass =
                  align === 'right'
                    ? 'text-right'
                    : align === 'center'
                      ? 'text-center'
                      : 'text-left';
                return (
                  <TableHead
                    key={header.id}
                    scope="col"
                    className={cn(HEAD_CELL, alignClass, extraClass)}>
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
              <TableRow
                key={`skeleton-${idx}`}
                className={disableZebra || idx % 2 === 0 ? BODY_ROW_PLAIN : BODY_ROW_TINTED}>
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
              const zebraClass =
                disableZebra || itemIndices[idx] % 2 === 0 ? BODY_ROW_PLAIN : BODY_ROW_TINTED;
              return (
                <TableRow key={key} className={zebraClass}>
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
    </>
  );
}
