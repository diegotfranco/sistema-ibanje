import * as repo from './repository.js';
import { assertPermission } from '../../../lib/permissions.js';
import { paginate } from '../../../lib/pagination.js';
import type {
  CreateDesignatedFundRequest,
  UpdateDesignatedFundRequest,
  DesignatedFundResponse
} from './schema.js';

export async function listDesignatedFunds(callerId: number, page: number, limit: number) {
  await assertPermission(callerId, 'Caixa', 'Acessar');
  const skip = (page - 1) * limit;
  const { rows, total } = await repo.listDesignatedFunds(skip, limit);
  return paginate(rows.map((r): DesignatedFundResponse => r), total, page, limit);
}

export async function getDesignatedFundById(id: number): Promise<DesignatedFundResponse | null> {
  return repo.findDesignatedFundById(id);
}

export async function createDesignatedFund(
  callerId: number,
  body: CreateDesignatedFundRequest
): Promise<DesignatedFundResponse> {
  await assertPermission(callerId, 'Caixa', 'Cadastrar');
  const created = await repo.insertDesignatedFund(body);
  if (!created) throw new Error('Failed to create designated fund');
  return created;
}

export async function updateDesignatedFund(
  callerId: number,
  targetId: number,
  body: UpdateDesignatedFundRequest
): Promise<DesignatedFundResponse | null> {
  await assertPermission(callerId, 'Caixa', 'Editar');
  const fund = await repo.findDesignatedFundById(targetId);
  if (!fund) return null;
  return repo.updateDesignatedFund(targetId, body);
}

export async function deactivateDesignatedFund(
  callerId: number,
  targetId: number
): Promise<void | null> {
  await assertPermission(callerId, 'Caixa', 'Remover');
  const fund = await repo.findDesignatedFundById(targetId);
  if (!fund) return null;
  await repo.deactivateDesignatedFund(targetId);
}
