import { FastifyRequest, FastifyReply } from 'fastify';
import type {
  CreateExpenseEntryRequest,
  UpdateExpenseEntryRequest,
  ExpenseSummaryQuery
} from './schema.js';
import type { IdParam } from '../../../../lib/validation.js';
import type { PaginationQuery } from '../../../../lib/pagination.js';
import { ALLOWED_MIME_TYPES } from '../../../../lib/storage.js';
import { logAudit, diffResponse } from '../../../../lib/audit.js';
import * as service from './service.js';

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const { page, limit } = req.query as PaginationQuery;
  return reply.send(await service.listExpenseEntries(req.session.userId!, page, limit));
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const entry = await service.getExpenseEntryById(id);
  if (!entry) return reply.code(404).send({ message: 'Expense entry not found' });
  return reply.send(entry);
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as CreateExpenseEntryRequest;
  const entry = await service.createExpenseEntry(req.session.userId!, body);
  logAudit(req.session.userId!, 'create', 'expense_entry', entry.id, { ipAddress: req.ip });
  return reply.code(201).send(entry);
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as UpdateExpenseEntryRequest;
  const before = await service.getExpenseEntryById(id);
  const entry = await service.updateExpenseEntry(req.session.userId!, id, body);
  if (!entry) return reply.code(404).send({ message: 'Expense entry not found' });
  logAudit(req.session.userId!, 'update', 'expense_entry', id, {
    ipAddress: req.ip,
    changes: diffResponse(before, entry)
  });
  return reply.send(entry);
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const before = await service.getExpenseEntryById(id);
  const result = await service.cancelExpenseEntry(req.session.userId!, id);
  if (result === null) return reply.code(404).send({ message: 'Expense entry not found' });
  // Finance entries are voided (status → cancelada), never hard-deleted, so this is a state change.
  logAudit(req.session.userId!, 'state_change', 'expense_entry', id, {
    ipAddress: req.ip,
    changes: before ? { status: { from: before.status, to: 'cancelada' } } : undefined
  });
  return reply.code(204).send();
}

export async function uploadReceipt(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;

  const file = await req.file();
  if (!file) return reply.code(400).send({ message: 'No file uploaded' });

  const buffer = await file.toBuffer();
  const entry = await service.uploadExpenseReceipt(req.session.userId!, id, buffer, file.mimetype);
  if (!entry) return reply.code(404).send({ message: 'Expense entry not found' });
  return reply.send(entry);
}

export async function deleteReceipt(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const result = await service.deleteExpenseReceipt(req.session.userId!, id);
  if (result === 'not_found') return reply.code(404).send({ message: 'Expense entry not found' });
  if (result === 'no_receipt')
    return reply.code(404).send({ message: 'No receipt attached to this entry' });
  return reply.code(204).send();
}

export async function getReceipt(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const file = await service.getExpenseReceiptFile(req.session.userId!, id);
  if (!file) return reply.code(404).send({ message: 'Receipt not found' });
  // Receipts are served from the same origin as the SPA (the API is proxied under /api/), so we
  // force a download rather than let the browser render the bytes in-page. Combined with `nosniff`
  // this neutralizes any stored-content XSS even if a wrong content-type ever slipped past upload
  // validation (which already magic-byte-checks against the jpeg/png/pdf allowlist).
  const ext = ALLOWED_MIME_TYPES[file.contentType] ?? 'bin';
  reply.header('Content-Type', file.contentType);
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('Content-Disposition', `attachment; filename="comprovante-${id}.${ext}"`);
  if (file.contentLength !== null) reply.header('Content-Length', file.contentLength);
  return reply.send(file.body);
}

export async function summary(req: FastifyRequest, reply: FastifyReply) {
  const query = req.query as ExpenseSummaryQuery;
  return reply.send(await service.summarizeExpenses(req.session.userId!, query));
}
