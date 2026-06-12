import { z } from 'zod';
import { ATTENDER_STATUS_VALUES, ATTENDER_INACTIVE_FILTER } from '@sistema-ibanje/shared';
import { paginatedSchema } from '../../lib/http-schemas.js';
import {
  phoneField,
  cepField,
  optionalEmailField,
  ufField,
  trimmedString
} from '../../lib/normalize.js';

// Month-granular fields use the human-readable `YYYY-MM` wire format; the service converts
// to/from the DB's YYYYMM integer. Shared by the membership fields and the donation queries.
const MonthStringSchema = z.string().regex(/^\d{4}-\d{2}$/, 'Formato esperado: YYYY-MM');

// Shared filter shape for the list and the roster export. `isMember` arrives as the literal
// string "true"/"false" — `z.coerce.boolean()` is wrong here (it maps "false" → true).
// `status` accepts the real enum values plus the pseudo-token `inativo`, which the repository
// expands to the union of the terminal (exit) states.
const attenderStatusFilterValues = [...ATTENDER_STATUS_VALUES, ATTENDER_INACTIVE_FILTER] as const;
const attenderFilterShape = {
  isMember: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  status: z.enum(attenderStatusFilterValues).optional(),
  // Trash view: 'only' shows soft-deleted rows, 'include' shows both. Omitted = live rows only.
  deleted: z.enum(['only', 'include']).optional(),
  // Diacritic/case-insensitive name search (server-side LIKE), like the categories list.
  q: z.string().trim().min(1).max(64).optional()
};

export const ListAttendersRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  ...attenderFilterShape
});

export const AttendersExportPdfQuerySchema = z.object({
  // Comma-separated column keys; validated against an allowlist in the PDF service.
  columns: z.string().optional(),
  ...attenderFilterShape
});

export type AttenderFilters = {
  isMember?: boolean;
  status?: (typeof attenderStatusFilterValues)[number];
  deleted?: 'only' | 'include';
  q?: string;
};
export type ListAttendersRequest = z.infer<typeof ListAttendersRequestSchema>;

export const CreateAttenderRequestSchema = z.object({
  userId: z.number().int().positive().optional(),
  name: trimmedString(96, 2),
  birthDate: z.iso.date().optional(),
  addressStreet: trimmedString(96).nullable().optional(),
  addressNumber: trimmedString(16).nullable().optional(),
  addressComplement: trimmedString(64).nullable().optional(),
  addressDistrict: trimmedString(64).nullable().optional(),
  state: ufField.nullable().optional(),
  city: trimmedString(96).nullable().optional(),
  postalCode: cepField.nullable().optional(),
  email: optionalEmailField.nullable().optional(),
  phone: phoneField.nullable().optional(),
  isMember: z.boolean().optional().default(false),
  baptismDate: z.iso.date().nullable().optional(),
  memberSince: MonthStringSchema.nullable().optional(),
  congregatingSince: MonthStringSchema.nullable().optional(),
  admissionMode: z
    .enum(['aclamação', 'batismo', 'carta de transferência', 'profissão de fé'])
    .nullable()
    .optional()
});

// Membership and admission data are NOT editable through the generic edit form — they change
// only via the dedicated admission action (`PATCH /:id/membership`) or the status exits. Edit
// is limited to identity/contact/address fields.
export const UpdateAttenderRequestSchema = CreateAttenderRequestSchema.partial().omit({
  isMember: true,
  baptismDate: true,
  memberSince: true,
  admissionMode: true
});

// Admission (congregado → membro). A formal event: requires the admission mode and the month
// the membership started; baptism date is optional context. An incoming transfer letter, when
// applicable, is recorded separately in the membership-letters module (it already references
// the attender), so it is not part of this payload.
export const AdmitMemberRequestSchema = z.object({
  admissionMode: z.enum(['aclamação', 'batismo', 'carta de transferência', 'profissão de fé']),
  memberSince: MonthStringSchema,
  baptismDate: z.iso.date().nullable().optional()
});

// Drives the single guarded lifecycle endpoint (PATCH /attenders/:id/status). The service
// enforces the legal transitions and the per-state requiredness of `exitDate` (required when
// entering a formal-exit state) and validates `exitLetterId` against the attender's letters.
export const ChangeAttenderStatusRequestSchema = z.object({
  status: z.enum(ATTENDER_STATUS_VALUES),
  exitDate: z.iso.date().nullable().optional(),
  exitReason: z.string().max(256).nullable().optional(),
  exitLetterId: z.number().int().positive().nullable().optional()
});

export const AttenderResponseSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive().nullable(),
  name: z.string(),
  birthDate: z.string().nullable(),
  addressStreet: z.string().nullable(),
  addressNumber: z.string().nullable(),
  addressComplement: z.string().nullable(),
  addressDistrict: z.string().nullable(),
  state: z.string().nullable(),
  city: z.string().nullable(),
  postalCode: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  status: z.string(),
  exitDate: z.string().nullable(),
  exitReason: z.string().nullable(),
  exitLetterId: z.number().int().positive().nullable(),
  isMember: z.boolean(),
  baptismDate: z.string().nullable(),
  memberSince: z.string().nullable(),
  congregatingSince: z.string().nullable(),
  admissionMode: z.string().nullable(),
  createdAt: z.date()
});

export const AttenderListResponseSchema = paginatedSchema(AttenderResponseSchema);

export const DonationsSummaryQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional()
});

export const DonationsEntriesQuerySchema = z.object({
  month: MonthStringSchema
});

export const DonationsPdfQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: MonthStringSchema.optional()
});

export const DonationGroupSchema = z.object({
  categoryName: z.string(),
  campaignName: z.string().nullable(),
  eventName: z.string().nullable(),
  total: z.string()
});

export const DonationMonthSchema = z.object({
  month: z.string(),
  label: z.string(),
  total: z.string(),
  groups: z.array(DonationGroupSchema)
});

export const AttenderDonationsSummaryResponseSchema = z.object({
  year: z.number().int(),
  availableYears: z.array(z.number().int()),
  months: z.array(DonationMonthSchema),
  grandTotal: z.string()
});

export const DonationEntrySchema = z.object({
  id: z.number().int().positive(),
  depositDate: z.string(),
  categoryName: z.string(),
  campaignName: z.string().nullable(),
  eventName: z.string().nullable(),
  paymentMethodName: z.string(),
  amount: z.string()
});

export const AttenderDonationsEntriesResponseSchema = z.object({
  month: z.string(),
  label: z.string(),
  entries: z.array(DonationEntrySchema),
  total: z.string()
});

export type CreateAttenderRequest = z.infer<typeof CreateAttenderRequestSchema>;
export type UpdateAttenderRequest = z.infer<typeof UpdateAttenderRequestSchema>;
export type ChangeAttenderStatusRequest = z.infer<typeof ChangeAttenderStatusRequestSchema>;
export type AdmitMemberRequest = z.infer<typeof AdmitMemberRequestSchema>;
export type AttenderResponse = z.infer<typeof AttenderResponseSchema>;
export type AttenderDonationsSummaryResponse = z.infer<
  typeof AttenderDonationsSummaryResponseSchema
>;
export type AttenderDonationsEntriesResponse = z.infer<
  typeof AttenderDonationsEntriesResponseSchema
>;
