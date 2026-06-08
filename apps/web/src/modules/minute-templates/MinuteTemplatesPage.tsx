import { useState } from 'react';
import { PageContainer } from '@/components/PageContainer';
import { ResourceListPage } from '@/components/ResourceListPage';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Badge } from '@/components/ui/badge';
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
import type { MinuteTemplateFormValues, MinuteTemplateResponse } from './schema';

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
  const deleteTemplate = useDeleteMinuteTemplate();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MinuteTemplateResponse | null>(null);
  const [editTarget, setEditTarget] = useState<MinuteTemplateResponse | null>(null);

  const mutationId = editTarget?.id || 0;
  const updateMutation = useUpdateMinuteTemplate(mutationId);

  function handleCreate(values: MinuteTemplateFormValues) {
    createTemplate.mutate(values, { onSuccess: () => setFormOpen(false) });
  }

  function handleUpdate(values: MinuteTemplateFormValues) {
    if (!editTarget) return;
    updateMutation.mutate(values, {
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

  return (
    <>
      <PageContainer>
        <ResourceListPage<MinuteTemplateResponse>
          title="Modelos de Ata"
          columns={[
            { header: 'Nome', cell: (r) => <span className="font-medium">{r.name}</span> },
            { header: 'Tipo de Reunião', cell: (r) => meetingTypeLabel(r.meetingType) },
            {
              header: 'Padrão',
              cell: (r) => (r.isDefault ? <Badge variant="soft">Padrão</Badge> : null)
            },
            { header: 'Itens de Pauta', cell: (r) => r.defaultAgendaItems.length, hideBelow: 'md' }
          ]}
          data={list.data}
          isLoading={list.isLoading}
          emptyMessage="Nenhum modelo encontrado."
          onCreate={
            canCreate
              ? () => {
                  setEditTarget(null);
                  setFormOpen(true);
                }
              : undefined
          }
          onEdit={canUpdate ? handleOpenEdit : undefined}
          onDelete={canDelete ? (r) => setDeleteTarget(r) : undefined}
          canCreate={canCreate}
          canEdit={canUpdate}
          canDelete={canDelete}
          rowKey={(r) => r.id}
          mobileRow={(r) => (
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{r.name}</span>
                <span className="truncate text-sm text-muted-foreground">
                  {meetingTypeLabel(r.meetingType)}
                </span>
              </div>
              {r.isDefault && <Badge variant="soft">Padrão</Badge>}
            </div>
          )}
          mobileDetailTitle={(r) => r.name}
          mobileDetailFields={(r) => [
            { label: 'Nome', value: r.name },
            { label: 'Tipo de Reunião', value: meetingTypeLabel(r.meetingType) },
            { label: 'Padrão', value: r.isDefault ? 'Sim' : '—' },
            { label: 'Itens de Pauta', value: r.defaultAgendaItems.length }
          ]}
        />
      </PageContainer>

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
