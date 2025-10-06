import { sql } from "db/postgres";
import type { Cargo } from "dtos/cargo.dto";
import type { Permissao } from "dtos/permissao.dto";
import type { Usuario } from "dtos/usuario.dto";
import type { User } from "types/session.types";
import groupPermissions from "utils/groupPermissions";

export const findUserByEmail = async (email: string): Promise<Usuario> => {
  const users = await sql<Usuario[]>`
    select
      id,
      email,
      nome,
      hash,
      cargo_id
    from usuarios
    where email = ${email} and id_status = 1
  `;
  if (users.length === 0) throw new Error("not authenticated");
  return users[0];
};

export const findCargoById = async (id: number): Promise<Cargo> => {
  const cargos = await sql<Cargo[]>`
    select
      nome,
      descricao
    from cargos
    where id = ${id} and id_status = 1
  `;
  if (cargos.length === 0) throw new Error("not found");
  return cargos[0];
};

export const findPermissoesByUserId = async (
  id: number
): Promise<Permissao[]> => {
  const permissoes = await sql<Permissao[]>`
    select
      id_area,
      id_permissao
    from usuarios_x_areas_x_permissoes aux
    join areas a on a.id = aux.id_area
    join permissoes p on p.id = aux.id_permissao
    where aux.id_usuario = ${id};
  `;
  if (permissoes.length === 0) throw new Error("not found");
  return permissoes;
};

export const createUser = async (usuario: Usuario): Promise<User> => {
  const cargo = await findCargoById(usuario.id);
  const permissoes = await findPermissoesByUserId(usuario.id);

  return {
    id: usuario.id,
    email: usuario.email,
    name: usuario.nome,
    permissions: groupPermissions(permissoes),
    role: cargo.nome,
  };
};
