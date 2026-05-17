import { useState, useMemo } from 'react';
import { Eye, Pencil, Trash2, Plus } from 'lucide-react';
import { ResourceListPage } from '@/components/ResourceListPage';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import EntityPicker from '@/components/EntityPicker';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { useAttenders } from '@/modules/attenders/useAttenders';
import { ActiveStatus } from '@sistema-ibanje/shared';
import {
  useMembershipLetters,
  useCreateMembershipLetter,
  useUpdateMembershipLetter,
  useDeleteMembershipLetter
} from './useMembershipLetters';
import { MembershipLetterForm } from './MembershipLetterForm';
import { MembershipLetterPreviewDialog } from './MembershipLetterPreviewDialog';
import type {
  MembershipLetterResponse,
  MembershipLetterFormValues
} from '@/schemas/membership-letter';

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
}

const typeLabels = {
  pedido_de_carta_de_transferência: 'Pedido',
  carta_de_transferência: 'Carta'
};

const typeBadgeVariant = {
  pedido_de_carta_de_transferência: 'outline',
  carta_de_transferência: 'default'
} as const;

export default function MembershipLettersPage() {
  const { data: user } = useCurrentUser();
  const perms = user?.permissions;
  const canCreate = hasPermission(perms, Module.MembershipLetters, Action.Create);
  const canEdit = hasPermission(perms, Module.MembershipLetters, Action.Update);
  const canDelete = hasPermission(perms, Module.MembershipLetters, Action.Delete);

  const [limit] = useState(20);
  const [selectedAttenderId, setSelectedAttenderId] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const list = useMembershipLetters({
    page: 1,
    limit,
    attenderId: selectedAttenderId || undefined,
    type: selectedType || undefined
  });

  const attenders = useAttenders();
  const activeAttenders = (attenders.data?.data ?? []).filter(
    (a) => a.status === ActiveStatus.Active
  );

  const createMutation = useCreateMembershipLetter();
  const updateMutation = useUpdateMembershipLetter();
  const deleteMutation = useDeleteMembershipLetter();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MembershipLetterResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MembershipLetterResponse | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewId, setPreviewId] = useState<number | null>(null);

  const items = list.data?.data ?? [];

  function handleCreateSubmit(values: MembershipLetterFormValues) {
    createMutation.mutate(values, {
      onSuccess: () => {
        setDialogOpen(false);
      }
    });
  }

  function handleUpdateSubmit(values: MembershipLetterFormValues) {
    if (!editing) return;
    updateMutation.mutate(
      { id: editing.id, body: values },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setEditing(null);
        }
      }
    );
  }

  function handleDeleteConfirm() {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id, {
        onSuccess: () => {
          setDeleteTarget(null);
        }
      });
    }
  }

  const columns = useMemo(
    () => [
      {
        header: 'Tipo',
        cell: (row: unknown) => {
          const letter = row as MembershipLetterResponse;
          return <Badge variant={typeBadgeVariant[letter.type]}>{typeLabels[letter.type]}</Badge>;
        }
      },
      {
        header: 'Congregado',
        cell: (row: unknown) => {
          const letter = row as MembershipLetterResponse;
          const attender = activeAttenders.find((a) => a.id === letter.attenderId);
          return attender?.name ?? `ID: ${letter.attenderId}`;
        }
      },
      {
        header: 'Outra Igreja',
        cell: (row: unknown) => (row as MembershipLetterResponse).otherChurchName
      },
      {
        header: 'Cidade/UF',
        cell: (row: unknown) => {
          const letter = row as MembershipLetterResponse;
          const city = letter.otherChurchCity;
          const state = letter.otherChurchState;
          return state ? `${city}/${state}` : city;
        }
      },
      {
        header: 'Data',
        cell: (row: unknown) => formatDate((row as MembershipLetterResponse).letterDate)
      }
    ],
    [activeAttenders]
  );

  const actionColumn = {
    header: 'Ações',
    cell: (row: unknown) => {
      const letter = row as MembershipLetterResponse;
      return (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPreviewId(letter.id);
              setPreviewOpen(true);
            }}
            title="Visualizar">
            <Eye className="h-4 w-4" />
          </Button>
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditing(letter);
                setDialogOpen(true);
              }}
              title="Editar"
              className="text-warning hover:text-warning/80">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteTarget(letter)}
              title="Remover">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    }
  };

  const allColumns = [...columns, actionColumn];

  return (
    <>
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Cartas de Transferência</h1>
              <p className="text-muted-foreground mt-1">
                Gerencie cartas de transferência de membros
              </p>
            </div>
            {canCreate && (
              <Button
                onClick={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
                className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Carta
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-4 items-end p-4 bg-muted/50 rounded-lg">
          <div className="flex-1">
            <label className="text-sm font-medium block mb-2">Congregado</label>
            <EntityPicker
              items={activeAttenders}
              value={selectedAttenderId}
              onChange={setSelectedAttenderId}
              getValue={(a) => a.id}
              getLabel={(a) => a.name}
              placeholder="Todos os congregados"
              emptyMessage="Nenhum congregado encontrado."
              isLoading={attenders.isLoading}
              className="w-full"
              allowClear
            />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium block mb-2">Tipo</label>
            <Select value={selectedType ?? ''} onValueChange={(v) => setSelectedType(v || null)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os tipos</SelectItem>
                <SelectItem value="pedido_de_carta_de_transferência">Pedido</SelectItem>
                <SelectItem value="carta_de_transferência">Carta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ResourceListPage<MembershipLetterResponse>
          title=""
          columns={allColumns}
          data={items}
          isLoading={list.isLoading}
          rowKey={(row) => row.id}
          emptyMessage="Nenhuma carta de transferência encontrada."
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar Carta de Transferência' : 'Nova Carta de Transferência'}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? 'Atualize os dados da carta de transferência.'
                : 'Crie uma nova carta de transferência.'}
            </DialogDescription>
          </DialogHeader>
          <MembershipLetterForm
            initialValues={editing ?? undefined}
            isPending={createMutation.isPending || updateMutation.isPending}
            onSubmit={editing ? handleUpdateSubmit : handleCreateSubmit}
            onCancel={() => {
              setDialogOpen(false);
              setEditing(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
        title="Remover Carta"
        description={`Tem certeza que deseja remover a carta de transferência para ${deleteTarget?.otherChurchName}?`}
        isPending={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />

      <MembershipLetterPreviewDialog
        letterId={previewId}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </>
  );
}
