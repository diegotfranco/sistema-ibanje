import * as repo from './repository';
import { assertPermission } from '../../../../lib/permissions';
import { Module, Action } from '../../../../lib/constants';
import { httpError } from '../../../../lib/errors';
import { paginate } from '../../../../lib/pagination';
import type {
  CreateExpenseCategoryRequest,
  UpdateExpenseCategoryRequest,
  ExpenseCategoryResponse
} from './schema';

async function assertParentExists(parentId: number) {
  const parent = await repo.findExpenseCategoryById(parentId);
  if (!parent) throw httpError(404, 'Parent category not found');
}

export async function listExpenseCategories(callerId: number, page: number, limit: number) {
  await assertPermission(callerId, Module.ExpenseCategories, Action.View);
  const offset = (page - 1) * limit;
  const { rows, total } = await repo.listExpenseCategories(offset, limit);
  return paginate(rows.map((r): ExpenseCategoryResponse => r), total, page, limit);
}

export async function getExpenseCategoryById(id: number): Promise<ExpenseCategoryResponse | null> {
  return repo.findExpenseCategoryById(id);
}

export async function createExpenseCategory(
  callerId: number,
  body: CreateExpenseCategoryRequest
): Promise<ExpenseCategoryResponse> {
  await assertPermission(callerId, Module.ExpenseCategories, Action.Create);
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
  await assertPermission(callerId, Module.ExpenseCategories, Action.Update);
  const category = await repo.findExpenseCategoryById(targetId);
  if (!category) return null;
  if (body.parentId) await assertParentExists(body.parentId);
  return repo.updateExpenseCategory(targetId, body);
}

export async function deactivateExpenseCategory(
  callerId: number,
  targetId: number
): Promise<void | null> {
  await assertPermission(callerId, Module.ExpenseCategories, Action.Delete);
  const category = await repo.findExpenseCategoryById(targetId);
  if (!category) return null;
  await repo.deactivateExpenseCategory(targetId);
}
