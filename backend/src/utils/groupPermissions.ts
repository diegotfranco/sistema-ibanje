import { UserRolePermissionEntity } from '@/entities/user-role-permission';
import type { Permission } from '@/types/session.types';

export default (data: UserRolePermissionEntity[]): Permission[] => {
  return data.reduce<Permission[]>(
    (accumulator: Permission[], { id_area, id_permissao }: UserRolePermissionEntity) => {
      // Find the existing group for the key
      const areaGroup = accumulator.find(([area]) => area === id_area);

      // If the group exists, push the value into it
      // If the group does not exist, create a new group
      if (areaGroup != null) areaGroup[1].push(id_permissao);
      else accumulator.push([id_area, [id_permissao]]);
      return accumulator;
    },
    []
  );
};
