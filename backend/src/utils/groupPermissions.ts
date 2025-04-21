/* eslint-disable @typescript-eslint/naming-convention */
import type { Permissao } from "dtos/permissao.dto.js";
import type { Permission } from "types/session.types.js";

export default (data: Permissao[]): Permission[] => {
  return data.reduce<Permission[]>(
    (accumulator: Permission[], { id_area, id_permissao }: Permissao) => {
      // Find the existing group for the key
      const areaGroup = accumulator.find(([area]) => area === id_area);

      // If the group exists, push the value into it
      // If the group does not exist, create a new group
      areaGroup != null
        ? areaGroup[1].push(id_permissao)
        : accumulator.push([id_area, [id_permissao]]);
      return accumulator;
    },
    [],
  );
};
