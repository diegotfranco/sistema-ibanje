import * as repo from './repository.js';
import { assertPermission } from '../../lib/permissions.js';
import { Module, Action } from '../../lib/constants.js';
import { paginate } from '../../lib/pagination.js';
import type { ListAuditRequest } from './schema.js';

export async function listAudit(callerId: number, query: ListAuditRequest) {
  // Reading the audit trail is an administrative accountability action gated behind the dedicated
  // Auditoria module. By seed it's granted to Administrador only (the operator who reviews "who did
  // what"); it lives under the Administração section alongside Usuários/Cargos.
  await assertPermission(callerId, Module.Audit, Action.View);

  const { page, limit, ...filters } = query;
  const offset = (page - 1) * limit;
  const { rows, total } = await repo.listAudit(offset, limit, filters);
  return paginate(rows, total, page, limit);
}
