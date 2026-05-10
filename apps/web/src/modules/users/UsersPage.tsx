import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { CheckCircle, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
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
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import StatusBadge from '@/components/StatusBadge';
import { applyFieldErrors } from '@/lib/forms';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { ActiveStatus } from '@sistema-ibanje/shared';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { useUsers, useUserMutations } from './useUsers';
import UserForm from './UserForm';
import UserPermissionsDialog from './UserPermissionsDialog';
import type { UserCreateFormValues, UserEditFormValues, UserResponse } from '@/schemas/user';

type UserFormRefs = {
  createForm: ReturnType<typeof useForm<UserCreateFormValues>> | null;
  editForm: ReturnType<typeof useForm<UserEditFormValues>> | null;
};

export default function UsersPage() {
  const { data: user } = useCurrentUser();
  const perms = user?.permissions;
  const canCreate = hasPermission(perms, Module.Users, Action.Create);
  const canEdit = hasPermission(perms, Module.Users, Action.Update);
  const canDelete = hasPermission(perms, Module.Users, Action.Delete);

  const list = useUsers();
  const mutations = useUserMutations(user?.id);

  const [editing, setEditing] = useState<UserResponse | null | 'new'>(null);
  const [deleting, setDeleting] = useState<UserResponse | null>(null);
  const [permissionsTarget, setPermissionsTarget] = useState<UserResponse | null>(null);

  const formRef = useRef<UserFormRefs | null>(null);

  function handleSubmit(values: UserCreateFormValues | UserEditFormValues) {
    if (editing === 'new') {
      mutations.create.mutate(values as UserCreateFormValues, {
        onError: (err) => {
          const form = formRef.current?.createForm;
          if (form && !applyFieldErrors(err, form)) {
            toast.error(err instanceof Error ? err.message : 'Erro inesperado');
          }
        },
        onSuccess: () => setEditing(null)
      });
    } else if (editing) {
      mutations.update.mutate(
        { id: editing.id, body: values as UserEditFormValues },
        {
          onError: (err) => {
            const form = formRef.current?.editForm;
            if (form && !applyFieldErrors(err, form)) {
              toast.error(err instanceof Error ? err.message : 'Erro inesperado');
            }
          },
          onSuccess: () => setEditing(null)
        }
      );
    }
  }

  const data = list.data?.data ?? [];

  return (
    <>
      <div className="p-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Usuários</CardTitle>
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
                  <TableHead>E-mail</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-40 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}
                {!list.isLoading && data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                )}
                {!list.isLoading &&
                  data.map((row) => {
                    const self = mutations.isSelf(row.id);
                    return (
                      <TableRow key={row.id}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>{row.role}</TableCell>
                        <TableCell>
                          <StatusBadge status={row.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          {!self && (
                            <div className="flex items-center justify-end gap-1">
                              {canEdit && row.status === ActiveStatus.Pending && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => mutations.approve.mutate(row.id)}
                                  disabled={mutations.approve.isPending}
                                  aria-label="Aprovar"
                                  className="text-emerald-600 hover:text-emerald-700">
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
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
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={editing !== null} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'Novo Usuário' : 'Editar Usuário'}</DialogTitle>
          </DialogHeader>
          {editing !== null && (
            <UserForm
              initialValues={editing === 'new' ? undefined : editing}
              isPending={mutations.create.isPending || mutations.update.isPending}
              onSubmit={handleSubmit}
              onCancel={() => setEditing(null)}
              formRef={formRef}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(v) => !v && setDeleting(null)}
        description={`Remover o usuário "${deleting?.name}"?`}
        onConfirm={() =>
          deleting && mutations.remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
        }
        isPending={mutations.remove.isPending}
      />

      <UserPermissionsDialog
        user={permissionsTarget}
        open={permissionsTarget !== null}
        onOpenChange={(v) => !v && setPermissionsTarget(null)}
      />
    </>
  );
}
