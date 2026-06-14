import * as repo from './repository.js';
import { assertPermission } from '../../lib/permissions.js';
import { Module, Action } from '../../lib/constants.js';
import { paginate } from '../../lib/pagination.js';
import type { ListAuditRequest } from './schema.js';

export async function listAudit(callerId: number, query: ListAuditRequest) {
  // Reading the audit trail is an administrative accountability action, gated behind the same
  // privilege as user administration: whoever manages users is the operator who reviews "who did
  // what". No dedicated Audit permission exists by design — adding one would require a seed/migration
  // for marginal benefit at single-church scale.
  await assertPermission(callerId, Module.Users, Action.View);

  const { page, limit, ...filters } = query;
  const offset = (page - 1) * limit;
  const { rows, total } = await repo.listAudit(offset, limit, filters);
  return paginate(rows, total, page, limit);
}
