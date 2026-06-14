import * as repo from './repository.js';
import { assertPermission } from '../../lib/permissions.js';
import { Module, Action } from '../../lib/constants.js';
import { httpError, isUniqueViolation } from '../../lib/errors.js';
import { paginate } from '../../lib/pagination.js';
import { db } from '../../db/index.js';
import type { DeletedFilter } from '../../lib/softDelete.js';
import type {
  CreateRoleRequest,
  UpdateRoleRequest,
  SetRolePermissionsRequest,
  RoleResponse,
  RolePermissionResponse
} from './schema.js';

export async function listRoles(
  callerId: number,
  page: number,
  limit: number,
  deleted?: DeletedFilter
) {
  await assertPermission(callerId, Module.Roles, Action.View);

  const offset = (page - 1) * limit;
  const { rows, total } = await repo.listRoles(offset, limit, deleted);

  return paginate(
    rows.map((r): RoleResponse => r),
    total,
    page,
    limit
  );
}

export async function getRoleById(id: number): Promise<RoleResponse | null> {
  return repo.findRoleById(id);
}

export async function createRole(callerId: number, body: CreateRoleRequest): Promise<RoleResponse> {
  await assertPermission(callerId, Module.Roles, Action.Create);

  const created = await repo.insertRole(body);
  if (!created) throw new Error('Failed to create role');

  return created;
}

export async function updateRole(
  callerId: number,
  targetId: number,
  body: UpdateRoleRequest
): Promise<RoleResponse | null> {
  await assertPermission(callerId, Module.Roles, Action.Update);

  const role = await repo.findRoleById(targetId);
  if (!role) return null;

  return repo.updateRole(targetId, body);
}

export async function softDeleteRole(callerId: number, targetId: number): Promise<void | null> {
  await assertPermission(callerId, Module.Roles, Action.Delete);

  const role = await repo.findRoleById(targetId);
  if (!role) return null;

  const hasUsers = await repo.roleHasActiveUsers(targetId);
  if (hasUsers) throw httpError(409, 'Cannot delete a role that has users assigned to it');

  await repo.softDeleteRole(targetId);
}

export async function restoreRole(
  callerId: number,
  targetId: number
): Promise<RoleResponse | null> {
  await assertPermission(callerId, Module.Roles, Action.Delete);
  try {
    return await repo.restoreRole(targetId);
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw httpError(
        409,
        'Já existe um registro ativo com este nome. Renomeie o registro antes de restaurá-lo.',
        {
          fieldErrors: { name: 'Nome já em uso por um registro ativo.' }
        }
      );
    }
    throw err;
  }
}

export async function getRolePermissions(id: number): Promise<RolePermissionResponse[] | null> {
  const role = await repo.findRoleById(id);
  if (!role) return null;

  return repo.getRolePermissions(id);
}

// Base member floor: every role keeps at least `Acessar` on Painel/Congregados/Atas (what the
// Congregado role grants), so a configured role never drops below ordinary-member reach. Merged
// in at write time so the seed and the config UI stay consistent.
const BASE_FLOOR_MODULES: string[] = [Module.Dashboard, Module.Attenders, Module.Minutes];

async function withBaseMemberFloor(
  entries: { moduleId: number; permissionId: number }[]
): Promise<{ moduleId: number; permissionId: number }[]> {
  const [mods, perms] = await Promise.all([repo.listModules(), repo.listPermissionTypes()]);
  const access = perms.find((p) => p.name === Action.View);
  if (!access) return entries;

  const seen = new Set(entries.map((e) => `${e.moduleId}:${e.permissionId}`));
  const merged = [...entries];
  for (const mod of mods) {
    if (!BASE_FLOOR_MODULES.includes(mod.name)) continue;
    const key = `${mod.id}:${access.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({ moduleId: mod.id, permissionId: access.id });
  }
  return merged;
}

export async function setRolePermissions(
  callerId: number,
  targetId: number,
  body: SetRolePermissionsRequest
): Promise<void | null> {
  await assertPermission(callerId, Module.Roles, Action.Update);

  const role = await repo.findRoleById(targetId);
  if (!role) return null;

  const entries = await withBaseMemberFloor(body.permissions);
  return await db.transaction(async (tx) => {
    await repo.setRolePermissions(targetId, entries, tx);
  });
}

export async function listModules() {
  return repo.listModules();
}

export async function listPermissionTypes() {
  return repo.listPermissionTypes();
}
