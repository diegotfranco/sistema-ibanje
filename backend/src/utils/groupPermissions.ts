import { UserRolePermissionEntity } from '@/entities/user-module-permission';
import type { Permission } from '@/types/session.types';

export default (data: UserRolePermissionEntity[]): Permission[] => {
  return data.reduce<Permission[]>(
    (accumulator: Permission[], { module_id, permission_id }: UserRolePermissionEntity) => {
      // Find the existing group for the key
      const moduleGroup = accumulator.find(([module]) => module === module_id);

      // If the group exists, push the value into it
      // If the group does not exist, create a new group
      if (moduleGroup != null) moduleGroup[1].push(permission_id);
      else accumulator.push([module_id, [permission_id]]);
      return accumulator;
    },
    []
  );
};
