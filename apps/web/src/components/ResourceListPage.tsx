import { useState, type ReactNode } from 'react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeaderRow, CardTitle } from '@/components/Card';
import {
  DataTable,
  type DataTableSearchable,
  type TableFilterOption
} from '@/components/DataTable';
import { RowDetailPanel, type RowDetailField } from '@/components/RowDetailPanel';

export interface ResourceColumn<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  hideBelow?: 'md' | 'lg' | 'xl';
  /** Stable column id (defaults to `col-{index}`). Set it to a meaningful key when the
   *  parent needs to map visible columns back to fields (e.g. for exports). */
  id?: string;
  /** Label shown in the "Colunas" toggle menu (defaults to `header`). */
  label?: string;
  /** Hidden by default but still toggleable via the "Colunas" menu. */
  defaultHidden?: boolean;
  /** Renders a filter funnel in the header (server-side; wire `filters`/`onFilterChange`). */
  filter?: { options: TableFilterOption[]; allLabel?: string };
}

export interface CustomAction<T> {
  label: string;
  icon?: ReactNode;
  onClick: (row: T) => void;
  className?: string;
}

interface ResourceListPageProps<T> {
  title: string;
  columns: ResourceColumn<T>[];
  data: T[] | undefined;
  isLoading: boolean;
  onCreate?: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  customActions?: CustomAction<T>[];
  emptyMessage?: string;
  rowKey: (row: T) => string | number;
  // Mobile-card rendering. When set, viewports below `md` switch from a Table
  // to a `<ul>` of cards (see DataTable). If `mobileDetailFields` is also set,
  // tapping a card opens a sheet with the full row + Edit/Delete in the footer
  // (per-card actions are intentionally hidden on mobile to avoid duplication).
  mobileRow?: (row: T) => ReactNode;
  mobileDetailFields?: (row: T) => RowDetailField[];
  mobileDetailTitle?: (row: T) => string;
  // Optional enhancements: column visibility toggle, toolbar filters, pagination
  columnToggle?: boolean;
  tableId?: string;
  toolbarRight?: ReactNode;
  pagination?: ReactNode;
  onColumnVisibilityChange?: (visibleColumnIds: string[]) => void;
  // Search + per-column header filters (forwarded to DataTable; both server-side).
  searchable?: DataTableSearchable;
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  filters?: Record<string, string | undefined>;
  onFilterChange?: (columnId: string, value: string | undefined) => void;
}

export function ResourceListPage<T>({
  title,
  columns,
  data,
  isLoading,
  onCreate,
  onEdit,
  onDelete,
  canCreate,
  canEdit,
  canDelete,
  customActions,
  emptyMessage = 'Nenhum registro encontrado.',
  rowKey,
  mobileRow,
  mobileDetailFields,
  mobileDetailTitle,
  columnToggle,
  tableId,
  toolbarRight,
  pagination,
  onColumnVisibilityChange,
  searchable,
  globalFilter,
  onGlobalFilterChange,
  filters,
  onFilterChange
}: ResourceListPageProps<T>) {
  const [detailRow, setDetailRow] = useState<T | null>(null);

  const showActions =
    (canEdit && onEdit) || (canDelete && onDelete) || (customActions && customActions.length > 0);

  const tableColumns: ColumnDef<T, unknown>[] = columns.map((col, i) => {
    const meta: {
      className?: string;
      hideBelow?: 'md' | 'lg' | 'xl';
      label?: string;
      defaultHidden?: boolean;
      filter?: { options: TableFilterOption[]; allLabel?: string };
    } = {};
    if (col.className) meta.className = col.className;
    if (col.hideBelow) meta.hideBelow = col.hideBelow;
    if (col.label) meta.label = col.label;
    if (col.defaultHidden) meta.defaultHidden = col.defaultHidden;
    if (col.filter) meta.filter = col.filter;
    return {
      id: col.id ?? `col-${i}`,
      header: col.header,
      cell: ({ row }) => col.cell(row.original),
      meta: Object.keys(meta).length ? meta : undefined
    };
  });

  if (showActions) {
    tableColumns.push({
      id: '__actions',
      header: 'Ações',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          {customActions?.map((action) => (
            <Button
              key={action.label}
              size="sm"
              variant="ghost"
              onClick={() => action.onClick(row.original)}
              aria-label={action.label}
              className={action.className}
              title={action.label}>
              {action.icon || action.label}
            </Button>
          ))}
          {canEdit && onEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(row.original)}
              aria-label="Editar"
              title="Editar">
              <Edit size={16} />
            </Button>
          )}
          {canDelete && onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(row.original)}
              aria-label="Remover"
              title="Remover">
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      ),
      meta: { align: 'right', className: 'w-32' }
    });
  }

  const sheetActions = detailRow && showActions && (
    <div className="flex flex-wrap gap-2">
      {customActions?.map((action) => (
        <Button
          key={action.label}
          variant="outline"
          className={action.className}
          onClick={() => {
            action.onClick(detailRow);
            setDetailRow(null);
          }}>
          {action.icon}
          {action.label}
        </Button>
      ))}
      {canEdit && onEdit && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onEdit(detailRow);
            setDetailRow(null);
          }}>
          <Edit size={16} className="mr-1" />
          Editar
        </Button>
      )}
      {canDelete && onDelete && (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            onDelete(detailRow);
            setDetailRow(null);
          }}>
          <Trash2 size={16} className="mr-1" />
          Remover
        </Button>
      )}
    </div>
  );

  return (
    <>
      <Card className="pb-0">
        <CardHeaderRow>
          <CardTitle>{title}</CardTitle>
          {canCreate && onCreate && (
            <Button onClick={onCreate} size="sm">
              <Plus className="h-4 w-4" />
              Novo
            </Button>
          )}
        </CardHeaderRow>
        <CardContent className="p-0">
          <DataTable
            columns={tableColumns}
            data={data ?? []}
            isLoading={isLoading}
            emptyMessage={emptyMessage}
            getRowKey={(row) => rowKey(row)}
            mobileRow={mobileRow}
            mobileOnRowClick={mobileDetailFields ? (row) => setDetailRow(row) : undefined}
            columnToggle={columnToggle}
            tableId={tableId}
            toolbarRight={toolbarRight}
            onColumnVisibilityChange={onColumnVisibilityChange}
            searchable={searchable}
            globalFilter={globalFilter}
            onGlobalFilterChange={onGlobalFilterChange}
            filters={filters}
            onFilterChange={onFilterChange}
          />
        </CardContent>
      </Card>
      {pagination && <div className="mt-4">{pagination}</div>}
      {mobileDetailFields && detailRow && (
        <RowDetailPanel
          open={detailRow !== null}
          onOpenChange={(o) => !o && setDetailRow(null)}
          title={mobileDetailTitle?.(detailRow) ?? title}
          fields={mobileDetailFields(detailRow)}
          actions={sheetActions}
        />
      )}
    </>
  );
}
