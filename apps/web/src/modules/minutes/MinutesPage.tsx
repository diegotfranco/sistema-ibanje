import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus } from 'lucide-react';
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
import { MinuteStatus } from '@sistema-ibanje/shared';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { useMinutes, useCreateMinute, useDeleteMinute } from './useMinutes';
import MinuteForm from './MinuteForm';
import type { MinuteResponse, MinuteFormValues } from '@/schemas/minute';

function statusVariant(status: string) {
  if (status === MinuteStatus.Approved) return 'bg-muted text-success';
  if (status === MinuteStatus.Replaced) return 'bg-muted text-muted-foreground';
  return 'bg-muted text-warning';
}

export default function MinutesPage() {
  const { data: user } = useCurrentUser();
  const perms = user?.permissions;
  const canCreate = hasPermission(perms, Module.Minutes, Action.Create);
  const canDelete = hasPermission(perms, Module.Minutes, Action.Delete);

  const list = useMinutes();
  const createMinute = useCreateMinute();
  const deleteMinute = useDeleteMinute();
  const navigate = useNavigate();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MinuteResponse | null>(null);
  const items = list.data?.data ?? [];

  function handleCreate(values: MinuteFormValues) {
    createMinute.mutate(values, { onSuccess: () => setFormOpen(false) });
  }

  function canDeleteRow(row: MinuteResponse) {
    return !row.currentVersion || row.currentVersion.status !== MinuteStatus.Approved;
  }

  return (
    <>
      <div className="p-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Atas de Reuniões</CardTitle>
            {canCreate && (
              <Button onClick={() => setFormOpen(true)} size="sm">
                <Plus className="h-4 w-4" />
                Nova
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº da Ata</TableHead>
                  <TableHead>Reunião</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cartório</TableHead>
                  <TableHead className="w-32 text-right">Ações</TableHead>
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
                      Nenhuma ata encontrada.
                    </TableCell>
                  </TableRow>
                )}
                {items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.minuteNumber}</TableCell>
                    <TableCell className="text-muted-foreground">
                      Reunião #{row.meetingId}
                    </TableCell>
                    <TableCell>
                      {row.currentVersion ? `v${row.currentVersion.version}` : '—'}
                    </TableCell>
                    <TableCell>
                      {row.currentVersion ? (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusVariant(row.currentVersion.status)}`}>
                          {row.currentVersion.status}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>{row.isNotarized ? 'Sim' : 'Não'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/minutes/${row.id}`)}>
                          Abrir
                        </Button>
                        {canDelete && canDeleteRow(row) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive/80"
                            onClick={() => setDeleteTarget(row)}>
                            Excluir
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

      <MinuteForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        isPending={createMinute.isPending}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
        description={`Remover a ata "${deleteTarget?.minuteNumber}"? Esta ação é irreversível.`}
        onConfirm={() => {
          if (deleteTarget)
            deleteMinute.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
        }}
        isPending={deleteMinute.isPending}
      />
    </>
  );
}
