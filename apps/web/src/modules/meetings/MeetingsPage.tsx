import { useState } from 'react';
import { Pencil, Plus, Trash2, ClipboardEdit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Module, Action, hasPermission } from '@/lib/permissions';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { useMeetings, useMeetingMutations } from './useMeetings';
import MeetingForm from './MeetingForm';
import AgendaDialog from './AgendaDialog';
import type { MeetingResponse, MeetingFormValues } from '@/schemas/meeting';

function formatDate(d: string) {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

export default function PautasPage() {
  const { data: user } = useCurrentUser();
  const perms = user?.permissions;
  const canCreate = hasPermission(perms, Module.Agendas, Action.Create);
  const canEdit = hasPermission(perms, Module.Agendas, Action.Update);
  const canDelete = hasPermission(perms, Module.Agendas, Action.Delete);

  const list = useMeetings();
  const mutations = useMeetingMutations();
  const items = list.data?.data ?? [];

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MeetingResponse | null>(null);
  const [agendaTarget, setAgendaTarget] = useState<MeetingResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MeetingResponse | null>(null);

  function handleFormSubmit(values: MeetingFormValues) {
    if (editing) {
      mutations.update.mutate(
        { id: editing.id, body: values },
        {
          onSuccess: () => {
            setFormOpen(false);
            setEditing(null);
          }
        }
      );
    } else {
      mutations.create.mutate(values, { onSuccess: () => setFormOpen(false) });
    }
  }

  return (
    <>
      <div className="p-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Assembleias</CardTitle>
            {canCreate && (
              <Button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
                size="sm">
                <Plus className="h-4 w-4" />
                Nova
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Pauta</TableHead>
                  <TableHead>Pública</TableHead>
                  <TableHead>Ata</TableHead>
                  <TableHead className="w-36 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}
                {!list.isLoading && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nenhuma reunião encontrada.
                    </TableCell>
                  </TableRow>
                )}
                {items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{formatDate(row.meetingDate)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {row.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {row.agendaItems.length > 0 ? (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                          {row.agendaItems.length} {row.agendaItems.length === 1 ? 'item' : 'itens'}
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                          Pendente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{row.isPublic ? 'Sim' : 'Não'}</TableCell>
                    <TableCell>{row.hasMinutes ? 'Sim' : '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canEdit && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label="Editar"
                              onClick={() => {
                                setEditing(row);
                                setFormOpen(true);
                              }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label="Definir pauta"
                              onClick={() => setAgendaTarget(row)}>
                              <ClipboardEdit className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {canDelete && (
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Excluir"
                            disabled={row.hasMinutes}
                            className="text-red-600 hover:text-red-700 disabled:opacity-30"
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

      <MeetingForm
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultValues={
          editing
            ? { meetingDate: editing.meetingDate, type: editing.type, isPublic: editing.isPublic }
            : undefined
        }
        onSubmit={handleFormSubmit}
        isPending={mutations.create.isPending || mutations.update.isPending}
      />

      {agendaTarget && (
        <AgendaDialog
          open={agendaTarget !== null}
          onOpenChange={(v) => {
            if (!v) setAgendaTarget(null);
          }}
          meetingId={agendaTarget.id}
          currentItems={agendaTarget.agendaItems}
        />
      )}

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
        description={`Remover a reunião de ${deleteTarget ? formatDate(deleteTarget.meetingDate) : ''}?`}
        onConfirm={() => {
          if (deleteTarget)
            mutations.remove.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
        }}
        isPending={mutations.remove.isPending}
      />
    </>
  );
}
