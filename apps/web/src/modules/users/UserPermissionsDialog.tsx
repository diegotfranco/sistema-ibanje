import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import PermissionsMatrix from '@/components/PermissionsMatrix';
import {
  usePermissionsReference,
  type ModuleRef,
  type PermissionTypeRef
} from '@/hooks/usePermissionsReference';
import { useUserPermissions, useSaveUserPermissions } from '@/modules/users/useUsers';
import type { UserResponse } from '@/schemas/user';

function userPermsToMatrixValue(
  record: Record<string, string[]>,
  modules: ModuleRef[],
  permTypes: PermissionTypeRef[]
): Set<string> {
  const result = new Set<string>();
  for (const [modName, permNames] of Object.entries(record)) {
    const mod = modules.find((m) => m.name === modName);
    if (!mod) continue;
    for (const permName of permNames) {
      const perm = permTypes.find((p) => p.name === permName);
      if (!perm) continue;
      result.add(`${mod.id}:${perm.id}`);
    }
  }
  return result;
}

function matrixValueToUserPerms(
  value: Set<string>,
  modules: ModuleRef[],
  permTypes: PermissionTypeRef[]
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const key of value) {
    const [modId, permId] = key.split(':').map(Number);
    const mod = modules.find((m) => m.id === modId);
    const perm = permTypes.find((p) => p.id === permId);
    if (mod && perm) (result[mod.name] ??= []).push(perm.name);
  }
  return result;
}

interface UserPermissionsDialogProps {
  user: UserResponse | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function UserPermissionsDialog({
  user,
  open,
  onOpenChange
}: UserPermissionsDialogProps) {
  const ref = usePermissionsReference();
  const userPerms = useUserPermissions(open ? (user?.id ?? null) : null);
  const save = useSaveUserPermissions(user?.id ?? 0);

  const [localValue, setLocalValue] = useState<Set<string>>(new Set());
  const [syncedUserId, setSyncedUserId] = useState<number | null>(null);

  const currentUserId = open ? (user?.id ?? null) : null;
  const refReady = ref.modules.length > 0 && ref.permissionTypes.length > 0;
  if (currentUserId !== syncedUserId && !userPerms.isLoading && !ref.isLoading && refReady) {
    setSyncedUserId(currentUserId);
    setLocalValue(
      userPerms.data
        ? userPermsToMatrixValue(userPerms.data, ref.modules, ref.permissionTypes)
        : new Set()
    );
  }

  function handleSave() {
    save.mutate(matrixValueToUserPerms(localValue, ref.modules, ref.permissionTypes), {
      onSuccess: () => onOpenChange(false)
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Permissões — {user?.name}</DialogTitle>
        </DialogHeader>
        <PermissionsMatrix
          modules={ref.modules}
          permissionTypes={ref.permissionTypes}
          isLoadingReference={ref.isLoading || userPerms.isLoading}
          value={localValue}
          onChange={setLocalValue}
          disabled={save.isPending}
        />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={save.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={save.isPending || ref.isLoading}>
            {save.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
