import { useMemo, useState, type ReactNode } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { ChevronRight, Edit, Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeaderRow, CardTitle } from '@/components/Card';
import { DataTable } from '@/components/DataTable';
import { Pagination } from '@/components/Pagination';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { groupCategoriesByParent, type CategoryLike } from './category-grouping';

// Paginate parent groups (not items). Children always render fully under their
// parent on the current page; orphans always appear on the last page so they
// aren't shuffled around as the user pages through.
const GROUPS_PER_PAGE = 5;

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
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
  renderRowMeta?: (row: T) => ReactNode;
  createLabel?: string;
  /** Extra controls rendered in the card header, left of the create button (e.g. a TrashToggle). */
  headerActions?: ReactNode;
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
  onEdit,
  onDelete,
  renderRowMeta,
  createLabel = 'Adicionar',
  headerActions
}: Props<T>) {
  const { groups, orphans } = useMemo(() => groupCategoriesByParent(items), [items]);
  const [collapsed, setCollapsed] = useState<Partial<Record<SectionKey, boolean>>>({});
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(groups.length / GROUPS_PER_PAGE));
  // Clamp page during render (instead of useEffect) when the underlying list
  // shrinks due to search — see CLAUDE.md "set-state-in-effect" lint pattern.
  if (page > totalPages) setPage(1);
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * GROUPS_PER_PAGE;
  const pageGroups = groups.slice(pageStart, pageStart + GROUPS_PER_PAGE);
  const isLastPage = safePage === totalPages;

  const toggle = (key: SectionKey) =>
    setCollapsed((prev) => ({ ...prev, [key]: !(prev[key] ?? false) }));

  const flatRows = useMemo<FlatRow<T>[]>(() => {
    const rows: FlatRow<T>[] = [];
    for (const { parent, children } of pageGroups) {
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
    if (isLastPage && orphans.length > 0) {
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
  }, [pageGroups, orphans, collapsed, isLastPage]);

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

  const renderMobileRow = (r: FlatRow<T>) => {
    if (r._kind !== 'item') return null;
    const meta = renderRowMeta?.(r.row);
    return (
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className={cn('text-sm font-medium truncate', r.isOrphan && 'text-destructive')}>
            {r.row.name}
          </div>
          {meta && (
            <div
              className={cn(
                'text-xs text-muted-foreground truncate',
                r.isOrphan && 'text-destructive'
              )}>
              {r.isOrphan ? <>⚠ {meta}</> : meta}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
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
      </div>
    );
  };

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
            className={cn(
              'tabular-nums',
              !destructive && 'dark:bg-secondary dark:text-secondary-foreground'
            )}>
            {row.count}
          </Badge>
        </button>
        {!destructive && row.parent && (
          <div className="flex items-center gap-0.5">
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
      <CardHeaderRow>
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center gap-2">
          {headerActions}
          {canCreate && (
            <Button onClick={onCreate} size="sm">
              <Plus className="mr-1 h-4 w-4" />
              {createLabel}
            </Button>
          )}
        </div>
      </CardHeaderRow>
      <CardContent className="p-0">
        <DataTable
          columns={columns}
          data={flatRows}
          isLoading={isLoading}
          emptyMessage={emptyMessage}
          isSectionHeader={(r) => r._kind === 'section'}
          renderSectionHeader={renderSectionHeader}
          getRowKey={flatRowKey}
          mobileRow={renderMobileRow}
          disableZebra
          searchable={{ placeholder: 'Buscar...', loading: isSearching }}
          globalFilter={searchQuery}
          onGlobalFilterChange={onSearchChange}
        />
        <div className="border-t px-3 py-2 flex justify-end">
          <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </CardContent>
    </Card>
  );
}
