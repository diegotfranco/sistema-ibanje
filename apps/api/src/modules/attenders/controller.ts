import { FastifyRequest, FastifyReply } from 'fastify';
import type { z } from 'zod';
import type {
  CreateAttenderRequest,
  UpdateAttenderRequest,
  ListAttendersRequest,
  AttendersExportPdfQuerySchema,
  DonationsSummaryQuerySchema,
  DonationsEntriesQuerySchema,
  DonationsPdfQuerySchema
} from './schema.js';
import type { IdParam } from '../../lib/validation.js';
import { logAudit } from '../../lib/audit.js';
import * as service from './service.js';
import { renderAttenderDonationsPdf, renderAttendersRosterPdf } from './pdf-service.js';

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const { page, limit, isMember, status, q } = req.query as ListAttendersRequest;
  return reply.send(
    await service.listAttenders(req.session.userId!, page, limit, { isMember, status, q })
  );
}

export async function exportPdf(req: FastifyRequest, reply: FastifyReply) {
  const { columns, isMember, status, q } = req.query as z.infer<
    typeof AttendersExportPdfQuerySchema
  >;
  const result = await renderAttendersRosterPdf(req.session.userId!, {
    columns,
    filters: { isMember, status, q }
  });
  return reply
    .header('Content-Type', 'application/pdf')
    .header('Content-Disposition', `attachment; filename="${result.filename}"`)
    .send(result.buffer);
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const attender = await service.getAttenderById(req.session.userId!, id);
  if (!attender) return reply.code(404).send({ message: 'Attender not found' });
  return reply.send(attender);
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as CreateAttenderRequest;
  const attender = await service.createAttender(req.session.userId!, body);
  logAudit(req.session.userId!, 'create', 'attender', attender.id, { ipAddress: req.ip });
  return reply.code(201).send(attender);
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const body = req.body as UpdateAttenderRequest;
  const attender = await service.updateAttender(req.session.userId!, id, body);
  if (!attender) return reply.code(404).send({ message: 'Attender not found' });
  logAudit(req.session.userId!, 'update', 'attender', id, { ipAddress: req.ip });
  return reply.send(attender);
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const result = await service.deactivateAttender(req.session.userId!, id);
  if (result === null) return reply.code(404).send({ message: 'Attender not found' });
  logAudit(req.session.userId!, 'delete', 'attender', id, { ipAddress: req.ip });
  return reply.code(204).send();
}

export async function donationsSummary(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const { year } = req.query as z.infer<typeof DonationsSummaryQuerySchema>;
  const result = await service.getAttenderDonationsSummary(req.session.userId!, id, year);
  if (!result) return reply.code(404).send({ message: 'Attender not found' });
  return reply.send(result);
}

export async function donationsEntries(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const { month } = req.query as z.infer<typeof DonationsEntriesQuerySchema>;
  const result = await service.getAttenderDonationsEntries(req.session.userId!, id, month);
  if (!result) return reply.code(404).send({ message: 'Attender not found' });
  return reply.send(result);
}

export async function donationsPdf(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as IdParam;
  const { year, month } = req.query as z.infer<typeof DonationsPdfQuerySchema>;
  // Month wins over year so the export matches whichever scope the dialog is showing.
  const scope = month ? { month } : { year };
  const result = await renderAttenderDonationsPdf(req.session.userId!, id, scope);
  if (!result) return reply.code(404).send({ message: 'Attender not found' });
  return reply
    .header('Content-Type', 'application/pdf')
    .header('Content-Disposition', `attachment; filename="${result.filename}"`)
    .send(result.buffer);
}
