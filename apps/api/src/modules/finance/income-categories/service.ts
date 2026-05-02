import * as repo from './repository.js';
import { assertPermission } from '../../../lib/permissions.js';
import { httpError } from '../../../lib/errors.js';
import { paginate } from '../../../lib/pagination.js';
import type {
  CreateIncomeCategoryRequest,
  UpdateIncomeCategoryRequest,
  IncomeCategoryResponse
} from './schema.js';

async function assertParentExists(parentId: number) {
  const parent = await repo.findIncomeCategoryById(parentId);
  if (!parent) throw httpError(404, 'Parent category not found');
}

export async function listIncomeCategories(callerId: number, page: number, limit: number) {
  await assertPermission(callerId, 'Categorias de Entradas', 'Acessar');
  const skip = (page - 1) * limit;
  const { rows, total } = await repo.listIncomeCategories(skip, limit);
  return paginate(rows.map((r): IncomeCategoryResponse => r), total, page, limit);
}

export async function getIncomeCategoryById(id: number): Promise<IncomeCategoryResponse | null> {
  return repo.findIncomeCategoryById(id);
}

export async function createIncomeCategory(
  callerId: number,
  body: CreateIncomeCategoryRequest
): Promise<IncomeCategoryResponse> {
  await assertPermission(callerId, 'Categorias de Entradas', 'Cadastrar');
  if (body.parentId) await assertParentExists(body.parentId);
  const created = await repo.insertIncomeCategory(body);
  if (!created) throw new Error('Failed to create income category');
  return created;
}

export async function updateIncomeCategory(
  callerId: number,
  targetId: number,
  body: UpdateIncomeCategoryRequest
): Promise<IncomeCategoryResponse | null> {
  await assertPermission(callerId, 'Categorias de Entradas', 'Editar');
  const category = await repo.findIncomeCategoryById(targetId);
  if (!category) return null;
  if (body.parentId) await assertParentExists(body.parentId);
  return repo.updateIncomeCategory(targetId, body);
}

export async function deactivateIncomeCategory(
  callerId: number,
  targetId: number
): Promise<void | null> {
  await assertPermission(callerId, 'Categorias de Entradas', 'Remover');
  const category = await repo.findIncomeCategoryById(targetId);
  if (!category) return null;
  await repo.deactivateIncomeCategory(targetId);
}
