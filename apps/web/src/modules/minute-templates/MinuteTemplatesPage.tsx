import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { MeetingType } from '@sistema-ibanje/shared';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import {
  useMinuteTemplates,
  useCreateMinuteTemplate,
  useUpdateMinuteTemplate,
  useDeleteMinuteTemplate
} from './useMinuteTemplates';
import MinuteTemplateForm from './MinuteTemplateForm';
import type { MinuteTemplateFormValues, MinuteTemplateResponse } from '@/schemas/minute-template';

function meetingTypeLabel(type: string): string {
  return type === MeetingType.Ordinary ? 'Ordinária' : 'Extraordinária';
}

export default function MinuteTemplatesPage() {
  const { data: user } = useCurrentUser();
  const perms = user?.permissions;
  const canCreate = hasPermission(perms, Module.MinuteTemplates, Action.Create);
  const canUpdate = hasPermission(perms, Module.MinuteTemplates, Action.Update);
  const canDelete = hasPermission(perms, Module.MinuteTemplates, Action.Delete);

  const list = useMinuteTemplates();
  const createTemplate = useCreateMinuteTemplate();
  const updateTemplate = useUpdateMinuteTemplate(0);
  const deleteTemplate = useDeleteMinuteTemplate();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MinuteTemplateResponse | null>(null);
  const [editTarget, setEditTarget] = useState<MinuteTemplateResponse | null>(null);

  const items = list.data ?? [];

  function handleCreate(values: MinuteTemplateFormValues) {
    createTemplate.mutate(values, { onSuccess: () => setFormOpen(false) });
  }

  function handleUpdate(values: MinuteTemplateFormValues) {
    if (!editTarget) return;
    updateTemplate.mutate(values, {
      onSuccess: () => {
        setFormOpen(false);
        setEditTarget(null);
      }
    });
  }

  function handleOpenEdit(template: MinuteTemplateResponse) {
    setEditTarget(template);
    setFormOpen(true);
  }

  const mutationId = editTarget?.id || 0;
  const updateMutation = useUpdateMinuteTemplate(mutationId);

  return (
    <>
      <div className="p-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Modelos de Ata</CardTitle>
            {canCreate && (
              <Button
                onClick={() => {
                  setEditTarget(null);
                  setFormOpen(true);
                }}
                size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Novo Modelo
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo de Reunião</TableHead>
                  <TableHead>Padrão</TableHead>
                  <TableHead>Itens de Pauta</TableHead>
                  <TableHead className="w-32 text-right">Ações</TableHead>
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
                {!list.isLoading && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nenhum modelo encontrado.
                    </TableCell>
                  </TableRow>
                )}
                {items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{meetingTypeLabel(row.meetingType)}</TableCell>
                    <TableCell>
                      {row.isDefault && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          Padrão
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{row.defaultAgendaItems.length}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canUpdate && (
                          <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(row)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => setDeleteTarget(row)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <MinuteTemplateForm
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
          }
          setFormOpen(open);
        }}
        onSubmit={editTarget ? handleUpdate : handleCreate}
        isPending={editTarget ? updateMutation.isPending : createTemplate.isPending}
        initialData={editTarget || undefined}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
        description={`Remover o modelo "${deleteTarget?.name}"? Esta ação é irreversível.`}
        onConfirm={() => {
          if (deleteTarget)
            deleteTemplate.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
        }}
        isPending={deleteTemplate.isPending}
      />
    </>
  );
}
