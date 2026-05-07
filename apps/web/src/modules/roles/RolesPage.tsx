import { useState } from 'react';
import { Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import StatusBadge from '@/components/StatusBadge';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { useRoles, useRoleMutations } from './useRoles';
import RoleForm from './RoleForm';
import RolePermissionsDialog from './RolePermissionsDialog';
import type { RoleFormValues, RoleResponse } from '@/schemas/role';

export default function RolesPage() {
  const { data: user } = useCurrentUser();
  const perms = user?.permissions;
  const canCreate = hasPermission(perms, Module.Roles, Action.Create);
  const canEdit = hasPermission(perms, Module.Roles, Action.Update);
  const canDelete = hasPermission(perms, Module.Roles, Action.Delete);

  const list = useRoles();
  const mutations = useRoleMutations();

  const [editing, setEditing] = useState<RoleResponse | null | 'new'>(null);
  const [deleting, setDeleting] = useState<RoleResponse | null>(null);
  const [permissionsTarget, setPermissionsTarget] = useState<RoleResponse | null>(null);

  function handleSubmit(values: RoleFormValues) {
    if (editing === 'new') {
      mutations.create.mutate(values, { onSuccess: () => setEditing(null) });
    } else if (editing) {
      mutations.update.mutate(
        { id: editing.id, body: values },
        { onSuccess: () => setEditing(null) }
      );
    }
  }

  const data = list.data?.data ?? [];

  return (
    <>
      <div className="p-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Cargos</CardTitle>
            {canCreate && (
              <Button size="sm" onClick={() => setEditing('new')}>
                <Plus className="h-4 w-4" />
                Novo
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  {(canEdit || canDelete) && (
                    <TableHead className="w-32 text-right">Ações</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}
                {!list.isLoading && data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhum cargo encontrado.
                    </TableCell>
                  </TableRow>
                )}
                {!list.isLoading &&
                  data.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.description ?? '—'}</TableCell>
                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>
                      {(canEdit || canDelete) && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canEdit && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setEditing(row)}
                                aria-label="Editar">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canEdit && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setPermissionsTarget(row)}
                                aria-label="Permissões">
                                <ShieldCheck className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setDeleting(row)}
                                aria-label="Remover"
                                className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={editing !== null} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'Novo Cargo' : 'Editar Cargo'}</DialogTitle>
          </DialogHeader>
          {editing !== null && (
            <RoleForm
              initialValues={editing === 'new' ? undefined : editing}
              isPending={mutations.create.isPending || mutations.update.isPending}
              onSubmit={handleSubmit}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(v) => !v && setDeleting(null)}
        description={`Remover o cargo "${deleting?.name}"?`}
        onConfirm={() =>
          deleting && mutations.remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
        }
        isPending={mutations.remove.isPending}
      />

      <RolePermissionsDialog
        role={permissionsTarget}
        open={permissionsTarget !== null}
        onOpenChange={(v) => !v && setPermissionsTarget(null)}
      />
    </>
  );
}
