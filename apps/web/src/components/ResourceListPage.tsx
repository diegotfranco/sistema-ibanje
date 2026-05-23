import { useState, type ReactNode } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeaderRow, CardTitle } from '@/components/Card';
import { DataTable } from '@/components/DataTable';
import { MobileRowDetailSheet, type RowDetailField } from '@/components/MobileRowDetailSheet';

export interface ResourceColumn<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
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
  mobileDetailTitle
}: ResourceListPageProps<T>) {
  const [detailRow, setDetailRow] = useState<T | null>(null);

  const showActions =
    (canEdit && onEdit) || (canDelete && onDelete) || (customActions && customActions.length > 0);

  const tableColumns: ColumnDef<T, unknown>[] = columns.map((col, i) => ({
    id: `col-${i}`,
    header: col.header,
    cell: ({ row }) => col.cell(row.original),
    meta: col.className ? { className: col.className } : undefined
  }));

  if (showActions) {
    tableColumns.push({
      id: '__actions',
      header: 'Ações',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          {customActions?.map((action) => (
            <Button
              key={action.label}
              size="icon"
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
              size="icon"
              variant="ghost"
              onClick={() => onEdit(row.original)}
              aria-label="Editar"
              className="text-warning hover:text-warning/80">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {canDelete && onDelete && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDelete(row.original)}
              aria-label="Remover"
              className="text-destructive hover:text-destructive/80">
              <Trash2 className="h-4 w-4" />
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
          onClick={() => {
            onEdit(detailRow);
            setDetailRow(null);
          }}>
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
      )}
      {canDelete && onDelete && (
        <Button
          variant="destructive"
          onClick={() => {
            onDelete(detailRow);
            setDetailRow(null);
          }}>
          <Trash2 className="h-4 w-4" />
          Remover
        </Button>
      )}
    </div>
  );

  return (
    <>
      <Card>
        <CardHeaderRow>
          <CardTitle className="text-xl">{title}</CardTitle>
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
          />
        </CardContent>
      </Card>
      {mobileDetailFields && detailRow && (
        <MobileRowDetailSheet
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
