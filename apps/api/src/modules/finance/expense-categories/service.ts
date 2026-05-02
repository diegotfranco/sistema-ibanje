import * as repo from './repository.js';
import { assertPermission } from '../../../lib/permissions.js';
import { httpError } from '../../../lib/errors.js';
import { paginate } from '../../../lib/pagination.js';
import type {
  CreateExpenseCategoryRequest,
  UpdateExpenseCategoryRequest,
  ExpenseCategoryResponse
} from './schema.js';

async function assertParentExists(parentId: number) {
  const parent = await repo.findExpenseCategoryById(parentId);
  if (!parent) throw httpError(404, 'Parent category not found');
}

export async function listExpenseCategories(callerId: number, page: number, limit: number) {
  await assertPermission(callerId, 'Categorias de Saídas', 'Acessar');
  const skip = (page - 1) * limit;
  const { rows, total } = await repo.listExpenseCategories(skip, limit);
  return paginate(rows.map((r): ExpenseCategoryResponse => r), total, page, limit);
}

export async function getExpenseCategoryById(id: number): Promise<ExpenseCategoryResponse | null> {
  return repo.findExpenseCategoryById(id);
}

export async function createExpenseCategory(
  callerId: number,
  body: CreateExpenseCategoryRequest
): Promise<ExpenseCategoryResponse> {
  await assertPermission(callerId, 'Categorias de Saídas', 'Cadastrar');
  if (body.parentId) await assertParentExists(body.parentId);
  const created = await repo.insertExpenseCategory(body);
  if (!created) throw new Error('Failed to create expense category');
  return created;
}

export async function updateExpenseCategory(
  callerId: number,
  targetId: number,
  body: UpdateExpenseCategoryRequest
): Promise<ExpenseCategoryResponse | null> {
  await assertPermission(callerId, 'Categorias de Saídas', 'Editar');
  const category = await repo.findExpenseCategoryById(targetId);
  if (!category) return null;
  if (body.parentId) await assertParentExists(body.parentId);
  return repo.updateExpenseCategory(targetId, body);
}

export async function deactivateExpenseCategory(
  callerId: number,
  targetId: number
): Promise<void | null> {
  await assertPermission(callerId, 'Categorias de Saídas', 'Remover');
  const category = await repo.findExpenseCategoryById(targetId);
  if (!category) return null;
  await repo.deactivateExpenseCategory(targetId);
}
