import { useState, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable } from '@/components/DataTable';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { useExpenseCategories, useExpenseCategoryMutations } from './useExpenseCategories';
import { ExpenseCategoryForm } from './ExpenseCategoryForm';
import { useCategoryPageData } from '../useCategoryPageData';
import { makeSubmitHandler } from '../entries-utils';
import type { ExpenseCategoryResponse } from './schema';
import { Pencil, Trash2, Plus } from 'lucide-react';

type GroupableCategory = { id: number; name: string; parentId: number | null };

function buildGroupedRows<T extends GroupableCategory>(rows: T[]): T[] {
  const parentMap = new Map<number, T[]>();
  const parents: T[] = [];
  const orphans: T[] = [];
  const parentIds = new Set<number | null>();

  rows.forEach((row) => {
    if (row.parentId === null) {
      parents.push(row);
      parentIds.add(row.id);
    }
  });

  parents.sort((a, b) => a.name.localeCompare(b.name));

  rows.forEach((row) => {
    if (row.parentId !== null) {
      if (!parentMap.has(row.parentId)) {
        parentMap.set(row.parentId, []);
      }
      parentMap.get(row.parentId)!.push(row);
    }
  });

  Array.from(parentMap.values()).forEach((children) => {
    children.sort((a, b) => a.name.localeCompare(b.name));
  });

  const result: T[] = [];

  parents.forEach((parent) => {
    result.push(parent);
    const children = parentMap.get(parent.id);
    if (children) {
      result.push(...children);
    }
  });

  rows.forEach((row) => {
    if (row.parentId !== null && !parentIds.has(row.parentId)) {
      orphans.push(row);
    }
  });

  orphans.sort((a, b) => a.name.localeCompare(b.name));
  result.push(...orphans);

  return result;
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export default function ExpenseCategoriesPage() {
  const { data: user } = useCurrentUser();
  const perms = user?.permissions;
  const canCreate = hasPermission(perms, Module.ExpenseCategories, Action.Create);
  const canEdit = hasPermission(perms, Module.ExpenseCategories, Action.Update);
  const canDelete = hasPermission(perms, Module.ExpenseCategories, Action.Delete);

  const list = useExpenseCategories();
  const { create, update, remove } = useExpenseCategoryMutations();

  const [editing, setEditing] = useState<ExpenseCategoryResponse | null | 'new'>(null);
  const [deleting, setDeleting] = useState<ExpenseCategoryResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { allCategories, items, getCategoryName } = useCategoryPageData(list.data?.data);
  const handleSubmit = makeSubmitHandler(editing, setEditing, create, update);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;

    const query = normalize(searchQuery);
    const parentById = new Map(allCategories.map((cat) => [cat.id, cat]));
    const matchedIds = new Set<number>();

    items.forEach((item) => {
      const nameMatches = normalize(item.name).includes(query);
      const parentMatches =
        item.parentId && normalize(parentById.get(item.parentId)?.name || '').includes(query);

      if (nameMatches || parentMatches) {
        matchedIds.add(item.id);
        if (item.parentId) {
          matchedIds.add(item.parentId);
        }
      }
    });

    items.forEach((parent) => {
      if (parent.parentId === null) {
        const children = items.filter((c) => c.parentId === parent.id);
        const childMatches = children.filter((c) => matchedIds.has(c.id));
        if (childMatches.length > 0 && childMatches.length === children.length) {
          matchedIds.add(parent.id);
        } else if (childMatches.length > 0) {
          matchedIds.add(parent.id);
          childMatches.forEach((c) => matchedIds.add(c.id));
        }
      }
    });

    return items.filter((item) => matchedIds.has(item.id));
  }, [searchQuery, items, allCategories]);

  const groupedItems = useMemo(() => buildGroupedRows(filteredItems), [filteredItems]);

  const columns = useMemo<ColumnDef<ExpenseCategoryResponse, unknown>[]>(() => {
    return [
      {
        id: 'index',
        header: '#',
        cell: ({ row }) => row.index + 1,
        meta: { hideBelow: 'sm', align: 'left' }
      },
      {
        id: 'grupo',
        header: 'Grupo',
        cell: ({ row }) => getCategoryName(row.original.parentId),
        meta: { hideBelow: 'md' }
      },
      {
        id: 'name',
        header: 'Categoria',
        cell: ({ row }) => (
          <span className={row.original.parentId ? 'pl-6' : ''}>{row.original.name}</span>
        ),
        meta: {}
      },
      {
        id: 'description',
        header: 'Descrição',
        cell: ({ row }) => row.original.description || '—',
        meta: { hideBelow: 'lg' }
      },
      {
        id: 'actions',
        header: 'Ações',
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(row.original)}
                aria-label={`Editar ${row.original.name}`}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleting(row.original)}
                aria-label={`Remover ${row.original.name}`}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
        meta: { align: 'right' }
      }
    ];
  }, [canEdit, canDelete, getCategoryName]);

  return (
    <>
      <Card className="p-8">
        <CardHeader className="flex flex-row items-center justify-between gap-4 p-0 pb-6">
          <CardTitle>Categorias de Saídas</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
            {canCreate && (
              <Button size="sm" onClick={() => setEditing('new')}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={groupedItems}
            isLoading={list.isLoading}
            emptyMessage="Nenhuma categoria encontrada."
            getRowKey={(row) => row.id}
          />
        </CardContent>
      </Card>

      <Dialog open={editing !== null} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'Nova categoria' : 'Editar categoria'}</DialogTitle>
          </DialogHeader>
          {editing !== null && (
            <ExpenseCategoryForm
              initialValues={editing === 'new' ? undefined : editing}
              categories={allCategories}
              isPending={create.isPending || update.isPending}
              onSubmit={handleSubmit}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(v) => !v && setDeleting(null)}
        description={`Tem certeza que deseja remover "${deleting?.name}"?`}
        onConfirm={() =>
          deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
        }
        isPending={remove.isPending}
      />
    </>
  );
}
