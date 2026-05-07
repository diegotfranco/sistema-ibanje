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
import { usePermissionsReference } from '@/hooks/usePermissionsReference';
import { useRolePermissions, useSaveRolePermissions } from '@/modules/roles/useRoles';
import type { RolePermissionEntry, RoleResponse } from '@/schemas/role';

function toMatrixValue(entries: RolePermissionEntry[]): Set<string> {
  return new Set(entries.map((e) => `${e.moduleId}:${e.permissionId}`));
}

function fromMatrixValue(value: Set<string>): { moduleId: number; permissionId: number }[] {
  return [...value].map((key) => {
    const [moduleId, permissionId] = key.split(':').map(Number);
    return { moduleId, permissionId };
  });
}

interface RolePermissionsDialogProps {
  role: RoleResponse | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function RolePermissionsDialog({
  role,
  open,
  onOpenChange
}: RolePermissionsDialogProps) {
  const ref = usePermissionsReference();
  const rolePerms = useRolePermissions(open ? (role?.id ?? null) : null);
  const save = useSaveRolePermissions(role?.id ?? 0);

  const [localValue, setLocalValue] = useState<Set<string>>(new Set());
  const [syncedRoleId, setSyncedRoleId] = useState<number | null>(null);

  const currentRoleId = open ? (role?.id ?? null) : null;
  if (currentRoleId !== syncedRoleId && !rolePerms.isLoading) {
    setSyncedRoleId(currentRoleId);
    setLocalValue(rolePerms.data ? toMatrixValue(rolePerms.data) : new Set());
  }

  function handleSave() {
    save.mutate(fromMatrixValue(localValue), {
      onSuccess: () => onOpenChange(false)
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Permissões — {role?.name}</DialogTitle>
        </DialogHeader>
        <PermissionsMatrix
          modules={ref.modules}
          permissionTypes={ref.permissionTypes}
          isLoadingReference={ref.isLoading || rolePerms.isLoading}
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
