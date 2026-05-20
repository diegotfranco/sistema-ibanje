import { useMemo, useState, type ReactNode } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { ChevronRight, Edit, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { DataTable } from '@/components/DataTable';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { groupCategoriesByParent, type CategoryLike } from './category-grouping';

interface Props<T extends CategoryLike> {
  title: string;
  items: T[];
  isLoading: boolean;
  isSearching?: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onCreate: () => void;
  onCreateInGroup?: (parentId: number) => void;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
  renderRowMeta?: (row: T) => ReactNode;
  createLabel?: string;
}

type SectionKey = number | 'orphans';

type SectionRow<T> = {
  _kind: 'section';
  parentId: SectionKey;
  label: string;
  count: number;
  parent?: T;
  isOrphans: boolean;
};

type ItemRow<T> = { _kind: 'item'; row: T; isOrphan: boolean };

type FlatRow<T> = SectionRow<T> | ItemRow<T>;

function flatRowKey<T extends CategoryLike>(row: FlatRow<T>): string {
  return row._kind === 'section' ? `section-${row.parentId}` : `item-${row.row.id}`;
}

export function CategoryGroupedList<T extends CategoryLike>({
  title,
  items,
  isLoading,
  isSearching = false,
  searchQuery,
  onSearchChange,
  canCreate,
  canEdit,
  canDelete,
  onCreate,
  onCreateInGroup,
  onEdit,
  onDelete,
  renderRowMeta,
  createLabel = 'Adicionar'
}: Props<T>) {
  const { groups, orphans } = useMemo(() => groupCategoriesByParent(items), [items]);
  const [collapsed, setCollapsed] = useState<Partial<Record<SectionKey, boolean>>>({});

  const toggle = (key: SectionKey) =>
    setCollapsed((prev) => ({ ...prev, [key]: !(prev[key] ?? false) }));

  const flatRows = useMemo<FlatRow<T>[]>(() => {
    const rows: FlatRow<T>[] = [];
    for (const { parent, children } of groups) {
      rows.push({
        _kind: 'section',
        parentId: parent.id,
        label: parent.name,
        count: children.length,
        parent,
        isOrphans: false
      });
      if (!(collapsed[parent.id] ?? false)) {
        for (const child of children) {
          rows.push({ _kind: 'item', row: child, isOrphan: false });
        }
      }
    }
    if (orphans.length > 0) {
      rows.push({
        _kind: 'section',
        parentId: 'orphans',
        label: 'Sem grupo (categorias órfãs)',
        count: orphans.length,
        isOrphans: true
      });
      if (!(collapsed['orphans'] ?? false)) {
        for (const orphan of orphans) {
          rows.push({ _kind: 'item', row: orphan, isOrphan: true });
        }
      }
    }
    return rows;
  }, [groups, orphans, collapsed]);

  const columns = useMemo<ColumnDef<FlatRow<T>, unknown>[]>(
    () => [
      {
        id: 'name',
        header: 'Nome',
        meta: { className: 'w-full' },
        cell: (info) => {
          const r = info.row.original;
          if (r._kind !== 'item') return null;
          return (
            <span className={cn('text-sm truncate block', r.isOrphan && 'text-destructive')}>
              {r.row.name}
            </span>
          );
        }
      },
      {
        id: 'meta',
        header: 'Descrição',
        meta: { hideBelow: 'md' },
        cell: (info) => {
          const r = info.row.original;
          if (r._kind !== 'item' || !renderRowMeta) return null;
          const content = (
            <div className="text-sm text-muted-foreground truncate">{renderRowMeta(r.row)}</div>
          );
          if (!r.isOrphan) return content;
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-sm text-destructive truncate">
                  ⚠ {renderRowMeta(r.row) ?? 'Grupo inexistente'}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                Esta categoria referencia um grupo inexistente. Edite-a para reatribuir.
              </TooltipContent>
            </Tooltip>
          );
        }
      },
      {
        id: 'actions',
        header: '',
        meta: { align: 'right' },
        cell: (info) => {
          const r = info.row.original;
          if (r._kind !== 'item') return null;
          return (
            <div className="flex items-center justify-end gap-1">
              {canEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(r.row)}
                  aria-label={`Editar ${r.row.name}`}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {canDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(r.row)}
                  aria-label={`Remover ${r.row.name}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        }
      }
    ],
    [canEdit, canDelete, onEdit, onDelete, renderRowMeta]
  );

  const renderSectionHeader = (row: FlatRow<T>) => {
    if (row._kind !== 'section') return null;
    const isCollapsed = collapsed[row.parentId] ?? false;
    const destructive = row.isOrphans;
    return (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => toggle(row.parentId)}
          className="group flex flex-1 items-center gap-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-md cursor-pointer"
          aria-expanded={!isCollapsed}
          aria-label={`${isCollapsed ? 'Expandir' : 'Recolher'} ${row.label}`}>
          <ChevronRight
            className={cn(
              'h-4 w-4 transition-transform',
              destructive ? 'text-destructive' : 'text-foreground',
              !isCollapsed && 'rotate-90'
            )}
          />
          <span
            className={cn(
              'text-sm font-semibold',
              destructive ? 'text-destructive' : 'text-foreground'
            )}>
            {row.label}
          </span>
          <Badge
            variant={destructive ? 'destructive' : 'soft'}
            className={cn('tabular-nums', !destructive && 'dark:bg-secondary dark:text-secondary-foreground')}>
            {row.count}
          </Badge>
        </button>
        {!destructive && row.parent && (
          <div className="flex items-center gap-0.5">
            {canEdit && onCreateInGroup && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => onCreateInGroup(row.parent!.id)}
                aria-label={`Adicionar item em ${row.label}`}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
            {canEdit && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => onEdit(row.parent!)}
                aria-label={`Editar grupo ${row.label}`}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => onDelete(row.parent!)}
                aria-label={`Remover grupo ${row.label}`}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  const emptyMessage = searchQuery
    ? `Nenhum resultado para "${searchQuery}".`
    : 'Nenhuma categoria cadastrada.';

  return (
    <Card className="pb-0">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          {canCreate && (
            <Button onClick={onCreate} size="sm">
              <Plus className="mr-1 h-4 w-4" />
              {createLabel}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-b px-3 py-2">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-8 pl-8"
            />
            {isSearching && (
              <Loader2 className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>
        <DataTable
          columns={columns}
          data={flatRows}
          isLoading={isLoading}
          emptyMessage={emptyMessage}
          isSectionHeader={(r) => r._kind === 'section'}
          renderSectionHeader={renderSectionHeader}
          getRowKey={flatRowKey}
        />
      </CardContent>
    </Card>
  );
}
