import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import type { ModuleRef, PermissionTypeRef } from '@/hooks/usePermissionsReference';

const SKELETON_KEYS = Array.from({ length: 5 }, () => crypto.randomUUID());

interface PermissionsMatrixProps {
  modules: ModuleRef[];
  permissionTypes: PermissionTypeRef[];
  isLoadingReference: boolean;
  value: Set<string>;
  onChange: (next: Set<string>) => void;
  disabled?: boolean;
}

export default function PermissionsMatrix({
  modules,
  permissionTypes,
  isLoadingReference,
  value,
  onChange,
  disabled
}: PermissionsMatrixProps) {
  if (isLoadingReference) {
    return (
      <div className="space-y-2">
        {SKELETON_KEYS.map((key) => (
          <Skeleton key={key} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  function toggle(moduleId: number, permId: number, checked: boolean) {
    const key = `${moduleId}:${permId}`;
    const next = new Set(value);
    if (checked) {
      next.add(key);
    } else {
      next.delete(key);
    }
    onChange(next);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="py-2 pr-4 text-left font-medium text-muted-foreground">Módulo</th>
            {permissionTypes.map((pt) => (
              <th key={pt.id} className="px-2 py-2 text-center font-medium text-muted-foreground">
                {pt.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {modules.map((mod, i) => (
            <tr key={mod.id} className={i % 2 === 0 ? 'bg-muted/30' : ''}>
              <td className="py-2 pr-4 font-medium">{mod.name}</td>
              {permissionTypes.map((pt) => {
                const key = `${mod.id}:${pt.id}`;
                return (
                  <td key={pt.id} className="px-2 py-2 text-center">
                    <Checkbox
                      checked={value.has(key)}
                      onCheckedChange={(checked) => toggle(mod.id, pt.id, checked === true)}
                      disabled={disabled}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
