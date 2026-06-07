import * as repo from './repository.js';
import {
  aggregateConfirmedDonationsByAttender,
  listDonationYearsByAttender,
  listConfirmedDonationEntriesByAttenderMonth
} from '../finance/income/entries/repository.js';
import { assertPermission, hasPermission } from '../../lib/permissions.js';
import { Module, Action } from '../../lib/constants.js';
import { httpError } from '../../lib/errors.js';
import { paginate } from '../../lib/pagination.js';
import type {
  CreateAttenderRequest,
  UpdateAttenderRequest,
  AttenderResponse,
  AttenderDonationsSummaryResponse,
  AttenderDonationsEntriesResponse,
  AttenderFilters
} from './schema.js';
import type { UpdateMyProfileRequest } from '../auth/schema.js';
import { db } from '../../db/index.js';
import { eq } from 'drizzle-orm';
import { users, attenders } from '../../db/schema.js';
import { yyyymmToString, stringToYyyymm } from '@sistema-ibanje/shared';

type AttenderRow = NonNullable<Awaited<ReturnType<typeof repo.findAttenderById>>>;

// Single read-path mapping: DB rows -> API response. Month fields are stored as YYYYMM ints
// and emitted as `YYYY-MM` strings.
function toAttenderResponse(row: AttenderRow): AttenderResponse {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    birthDate: row.birthDate,
    baptismDate: row.baptismDate,
    addressStreet: row.addressStreet,
    addressNumber: row.addressNumber,
    addressComplement: row.addressComplement,
    addressDistrict: row.addressDistrict,
    state: row.state,
    city: row.city,
    postalCode: row.postalCode,
    email: row.email,
    phone: row.phone,
    status: row.status,
    isMember: row.isMember,
    memberSince: row.memberSince == null ? null : yyyymmToString(row.memberSince),
    congregatingSince: row.congregatingSince == null ? null : yyyymmToString(row.congregatingSince),
    admissionMode: row.admissionMode,
    createdAt: row.createdAt
  };
}

// Write-path conversion for the two month fields (`YYYY-MM` string -> YYYYMM int), preserving
// the partial-update semantics: an omitted key stays omitted; an explicit null clears the column.
function monthFieldsToInt(body: Pick<UpdateAttenderRequest, 'memberSince' | 'congregatingSince'>): {
  memberSince?: number | null;
  congregatingSince?: number | null;
} {
  const out: { memberSince?: number | null; congregatingSince?: number | null } = {};
  if (body.memberSince !== undefined) {
    out.memberSince = body.memberSince == null ? null : stringToYyyymm(body.memberSince);
  }
  if (body.congregatingSince !== undefined) {
    out.congregatingSince =
      body.congregatingSince == null ? null : stringToYyyymm(body.congregatingSince);
  }
  return out;
}

export async function listAttenders(
  callerId: number,
  page: number,
  limit: number,
  filters?: AttenderFilters
) {
  // Listing every congregant is staff-only. `Acessar` can't gate this: the Congregado
  // (member) role holds it for self-service, so it'd leak the whole roster. `Relatórios`
  // is the common denominator of every staff role with Congregados access (Tesoureiro,
  // Secretário, Presidente, Vice-Presidente) and members lack it.
  await assertPermission(callerId, Module.Attenders, Action.Report);

  const offset = (page - 1) * limit;
  const { rows, total } = await repo.listAttenders(offset, limit, filters);

  return paginate(rows.map(toAttenderResponse), total, page, limit);
}

// Whole filtered roster for the PDF export. Same staff-only gate as the list.
export async function listAttendersForExport(callerId: number, filters?: AttenderFilters) {
  await assertPermission(callerId, Module.Attenders, Action.Report);
  return repo.listAttendersForExport(filters);
}

export async function getAttenderById(
  callerId: number,
  id: number
): Promise<AttenderResponse | null> {
  const attender = await repo.findAttenderById(id);
  if (!attender) return null;

  // A congregant may read only their own record; staff (Relatórios on Congregados) read any.
  // Returning null for unauthorized callers maps to 404, so we don't confirm the id exists.
  const link = await repo.findAttenderByUserId(callerId);
  const isSelfAccess = link?.id === id;
  if (!isSelfAccess && !(await hasPermission(callerId, Module.Attenders, Action.Report))) {
    return null;
  }

  return toAttenderResponse(attender);
}

export async function createAttender(
  callerId: number,
  body: CreateAttenderRequest
): Promise<AttenderResponse> {
  await assertPermission(callerId, Module.Attenders, Action.Create);

  if (body.userId !== undefined) {
    const user = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, body.userId))
      .limit(1);

    if (!user[0]) {
      throw httpError(404, 'User not found');
    }

    const existingAttender = await db
      .select({ id: attenders.id })
      .from(attenders)
      .where(eq(attenders.userId, body.userId))
      .limit(1);

    if (existingAttender[0]) {
      throw httpError(409, 'User is already linked to another attender', {
        fieldErrors: { userId: 'Usuário já possui frequentista vinculado' }
      });
    }
  }

  const created = await repo.insertAttender({
    userId: body.userId,
    name: body.name,
    birthDate: body.birthDate,
    baptismDate: body.baptismDate,
    addressStreet: body.addressStreet,
    addressNumber: body.addressNumber,
    addressComplement: body.addressComplement,
    addressDistrict: body.addressDistrict,
    state: body.state,
    city: body.city,
    postalCode: body.postalCode,
    email: body.email,
    phone: body.phone,
    isMember: body.isMember,
    admissionMode: body.admissionMode,
    ...monthFieldsToInt(body)
  });

  if (!created) {
    throw new Error('Failed to create attender');
  }

  return toAttenderResponse(created);
}

export async function updateAttender(
  callerId: number,
  targetId: number,
  body: UpdateAttenderRequest
): Promise<AttenderResponse | null> {
  await assertPermission(callerId, Module.Attenders, Action.Update);

  const attender = await repo.findAttenderById(targetId);
  if (!attender) return null;

  if (body.userId !== undefined) {
    const user = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, body.userId))
      .limit(1);

    if (!user[0]) {
      throw httpError(404, 'User not found');
    }

    const existingAttender = await db
      .select({ id: attenders.id })
      .from(attenders)
      .where(eq(attenders.userId, body.userId))
      .limit(1);

    if (existingAttender[0] && existingAttender[0].id !== targetId) {
      throw httpError(409, 'User is already linked to another attender', {
        fieldErrors: { userId: 'Usuário já possui frequentista vinculado' }
      });
    }
  }

  // Spread `rest` (without the string month fields) and re-add them as YYYYMM ints.
  const { memberSince, congregatingSince, ...rest } = body;
  const updated = await repo.updateAttender(targetId, {
    ...rest,
    ...monthFieldsToInt({ memberSince, congregatingSince })
  });
  if (!updated) return null;

  return toAttenderResponse(updated);
}

export async function deactivateAttender(callerId: number, targetId: number): Promise<void | null> {
  await assertPermission(callerId, Module.Attenders, Action.Delete);

  const attender = await repo.findAttenderById(targetId);
  if (!attender) return null;

  await repo.deactivateAttender(targetId);
}

const PT_MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

async function assertDonationsAccess(callerId: number, attenderId: number): Promise<void> {
  const callerLink = await repo.findAttenderByUserId(callerId);
  if (callerLink?.id === attenderId) return; // self-access
  await assertPermission(callerId, Module.IncomeEntries, Action.View);
}

export async function getAttenderDonationsSummary(
  callerId: number,
  attenderId: number,
  year?: number
): Promise<AttenderDonationsSummaryResponse | null> {
  const attender = await repo.findAttenderById(attenderId);
  if (!attender) return null;

  await assertDonationsAccess(callerId, attenderId);

  // Offer only years with actual giving; default to the most recent (or this year if none).
  const availableYears = await listDonationYearsByAttender(attenderId);
  const resolvedYear = year ?? availableYears[0] ?? new Date().getFullYear();

  // Rows arrive pre-grouped per (month, category, fund, event), exact SQL sums. We expand
  // into a fixed Jan→Dez skeleton so the statement (and its PDF) never varies its shape:
  // a month with no giving stays present with empty groups. Cents accumulate as integers
  // so the printed totals never drift.
  const rows = await aggregateConfirmedDonationsByAttender(attenderId, resolvedYear);

  type MonthAcc = {
    month: string;
    label: string;
    cents: number;
    groups: AttenderDonationsSummaryResponse['months'][number]['groups'];
  };
  const monthMap = new Map<string, MonthAcc>();
  for (let m = 1; m <= 12; m++) {
    const key = `${resolvedYear}-${String(m).padStart(2, '0')}`;
    monthMap.set(key, {
      month: key,
      label: `${PT_MONTHS[m - 1]} de ${resolvedYear}`,
      cents: 0,
      groups: []
    });
  }

  let grandCents = 0;
  for (const row of rows) {
    const cents = Math.round(parseFloat(row.total ?? '0') * 100);
    const entry = monthMap.get(row.month);
    if (!entry) continue;
    entry.groups.push({
      categoryName: row.categoryName,
      fundName: row.fundName,
      eventName: row.eventName,
      total: (cents / 100).toFixed(2)
    });
    entry.cents += cents;
    grandCents += cents;
  }

  const months = Array.from(monthMap.values()).map(({ month, label, cents, groups }) => ({
    month,
    label,
    total: (cents / 100).toFixed(2),
    groups
  }));

  return {
    year: resolvedYear,
    availableYears,
    months,
    grandTotal: (grandCents / 100).toFixed(2)
  };
}

export async function getAttenderDonationsEntries(
  callerId: number,
  attenderId: number,
  month: string
): Promise<AttenderDonationsEntriesResponse | null> {
  const attender = await repo.findAttenderById(attenderId);
  if (!attender) return null;

  await assertDonationsAccess(callerId, attenderId);

  const rows = await listConfirmedDonationEntriesByAttenderMonth(attenderId, month);

  let totalCents = 0;
  const entries = rows.map((row) => {
    const cents = Math.round(parseFloat(row.amount ?? '0') * 100);
    totalCents += cents;
    return {
      id: row.id,
      depositDate: row.depositDate,
      categoryName: row.categoryName,
      fundName: row.fundName,
      eventName: row.eventName,
      paymentMethodName: row.paymentMethodName,
      amount: (cents / 100).toFixed(2)
    };
  });

  const [year, m] = month.split('-');
  const label = `${PT_MONTHS[parseInt(m, 10) - 1]} de ${year}`;

  return { month, label, entries, total: (totalCents / 100).toFixed(2) };
}

export async function updateAttenderProfile(
  attenderId: number,
  body: UpdateMyProfileRequest
): Promise<AttenderResponse | null> {
  const updated = await repo.updateAttender(attenderId, body);
  if (!updated) return null;

  return toAttenderResponse(updated);
}
