import React from 'react';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import * as repo from './repository.js';
import { assertPermission } from '../../lib/permissions.js';
import { Module, Action } from '../../lib/constants.js';
import { ActiveStatus, MinuteStatus } from '@sistema-ibanje/shared';
import { httpError } from '../../lib/errors.js';
import { paginate } from '../../lib/pagination.js';
import { db } from '../../db/index.js';
import { uploadFile, deleteFile, getPresignedUrl } from '../../lib/storage.js';
import { fileTypeFromBuffer } from 'file-type';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { minuteTemplates } from '../../db/schema.js';
import * as churchSettingsRepo from '../church-settings/repository.js';
import { MinutePdf } from './pdf-template.js';
import { sanitizeMinuteDoc } from './sanitize.js';
import type {
  CreateMinuteRequest,
  UpdateMinuteVersionRequest,
  UpdateMinuteRequest,
  EditApprovedMinuteRequest,
  ApproveMinuteRequest,
  MinuteVersionResponse,
  MinuteResponse,
  MinuteTemplateResponse,
  UpdateMinuteTemplateRequest
} from './schema.js';
import type { Minute, MinuteVersion } from '../../db/schema.js';

function buildVersionResponse(v: MinuteVersion): MinuteVersionResponse {
  return {
    id: v.id,
    version: v.version,
    content: v.content,
    status: v.status as MinuteVersionResponse['status'],
    reasonForChange: v.reasonForChange ?? null,
    createdByUserId: v.createdByUserId,
    approvedAtMeetingId: v.approvedAtMeetingId ?? null,
    createdAt: v.createdAt.toISOString()
  };
}

function formatDateExtenso(dateStr: string | null): string {
  if (!dateStr) return '';
  const months = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro'
  ];
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day || month < 1 || month > 12) return '';
    return `${day} de ${months[month - 1]} de ${year}`;
  } catch {
    return '';
  }
}

function interpolateTemplate(template: unknown, variables: Record<string, string>): unknown {
  if (typeof template === 'string') {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return result;
  }
  if (Array.isArray(template)) {
    return template.map((item) => interpolateTemplate(item, variables));
  }
  if (template && typeof template === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(template)) {
      result[key] = interpolateTemplate(value, variables);
    }
    return result;
  }
  return template;
}

function buildInterpolationVariables(
  minute: Minute,
  meeting: { meetingDate: Date | null; type: string },
  church: {
    name: string;
    cnpj: string;
    addressStreet: string;
    addressNumber: string;
    addressDistrict: string;
    addressCity: string;
    addressState: string;
  },
  previousMinuteNumber: string,
  attendersPresent: Array<{ id: number; name: string }>
): Record<string, string> {
  return {
    church_name: church.name,
    church_cnpj: church.cnpj,
    church_address: `${church.addressStreet}, ${church.addressNumber}, ${church.addressDistrict}, ${church.addressCity}, ${church.addressState}`,
    meeting_date_extenso: formatDateExtenso(
      meeting.meetingDate ? meeting.meetingDate.toString() : null
    ),
    minute_number: minute.minuteNumber,
    presiding_pastor_name: minute.presidingPastorName ?? '',
    secretary_name: minute.secretaryName ?? '',
    previous_minute_number: previousMinuteNumber ?? '',
    opening_time: minute.openingTime ?? '',
    closing_time: minute.closingTime ?? '',
    members_present_count: String(attendersPresent.length),
    pautas: ''
  };
}

export function interpolateMinutePlaceholders(
  doc: unknown,
  minute: Minute,
  meeting: { meetingDate: Date | null; type: string },
  church: {
    name: string;
    cnpj: string;
    addressStreet: string;
    addressNumber: string;
    addressDistrict: string;
    addressCity: string;
    addressState: string;
  },
  previousMinuteNumber: string,
  attendersPresent: Array<{ id: number; name: string }>
): unknown {
  const vars = buildInterpolationVariables(
    minute,
    meeting,
    church,
    previousMinuteNumber,
    attendersPresent
  );
  return interpolateTemplate(doc, vars);
}

async function buildMinuteResponseAsync(
  minute: Minute,
  versions: MinuteVersion[]
): Promise<MinuteResponse> {
  const sorted = [...versions].sort((a, b) => a.version - b.version);
  const currentVersion =
    sorted.length > 0 ? buildVersionResponse(sorted[sorted.length - 1]!) : null;

  let signedDocumentPath: string | null = null;
  if (minute.signedDocumentPath) {
    try {
      signedDocumentPath = await getPresignedUrl(minute.signedDocumentPath);
    } catch {
      signedDocumentPath = null;
    }
  }

  const attendersPresent = await repo.getMeetingAttendersPresent(minute.meetingId);

  return {
    id: minute.id,
    meetingId: minute.meetingId,
    minuteNumber: minute.minuteNumber,
    isNotarized: minute.isNotarized,
    notarizedAt: minute.notarizedAt ? minute.notarizedAt.toISOString() : null,
    correctsMinuteId: minute.correctsMinuteId ?? null,
    presidingPastorName: minute.presidingPastorName ?? null,
    secretaryName: minute.secretaryName ?? null,
    openingTime: minute.openingTime ?? null,
    closingTime: minute.closingTime ?? null,
    signedDocumentPath,
    attendersPresent,
    currentVersion,
    versions: sorted.map(buildVersionResponse),
    createdAt: minute.createdAt.toISOString(),
    updatedAt: minute.updatedAt.toISOString()
  };
}

export async function listMinutes(callerId: number, page: number, limit: number) {
  await assertPermission(callerId, Module.Minutes, Action.View);
  const offset = (page - 1) * limit;
  const { rows, total } = await repo.listMinutes(offset, limit);
  const latestByMinute = await repo.findLatestVersionsForMinutes(rows.map((r) => r.id));
  const responses = await Promise.all(
    rows.map((row) => {
      const latest = latestByMinute.get(row.id);
      return buildMinuteResponseAsync(row, latest ? [latest] : []);
    })
  );
  return paginate(responses, total, page, limit);
}

export async function getMinuteById(id: number): Promise<MinuteResponse | null> {
  const minute = await repo.findMinuteById(id);
  if (!minute) return null;
  const versions = await repo.getVersionsForMinute(id);
  return buildMinuteResponseAsync(minute, versions);
}

export async function createMinute(
  callerId: number,
  body: CreateMinuteRequest
): Promise<MinuteResponse> {
  await assertPermission(callerId, Module.Minutes, Action.Create);

  const meeting = await repo.findMeetingById(body.meetingId);
  if (!meeting) throw httpError(404, 'Meeting not found');
  if (meeting.status === ActiveStatus.Inactive) throw httpError(400, 'Meeting is inactive');

  if (await repo.findMinuteByNumber(body.minuteNumber))
    throw httpError(409, 'Minute number already exists');
  if (await repo.findMinuteByMeetingId(body.meetingId))
    throw httpError(409, 'This meeting already has minutes');

  const churchSettings = await churchSettingsRepo.getChurchSettings();
  if (!churchSettings) throw httpError(409, 'Church settings not initialized');

  const template = await repo.findDefaultTemplateForMeetingType(meeting.type);
  const templateContent = template?.content ?? { type: 'doc', content: [] };

  // Store template content as-is (with placeholders intact)
  const interpolatedContent = templateContent;

  return await db.transaction(async (tx) => {
    const minute = await repo.insertMinute(
      {
        meetingId: body.meetingId,
        minuteNumber: body.minuteNumber,
        presidingPastorName:
          body.presidingPastorName ?? churchSettings.currentPresidentName ?? null,
        secretaryName: body.secretaryName ?? churchSettings.currentSecretaryName ?? null,
        openingTime: body.openingTime ?? null,
        closingTime: body.closingTime ?? null
      },
      tx
    );
    const version = await repo.insertMinuteVersion(
      {
        minuteId: minute.id,
        content: interpolatedContent,
        version: 1,
        status: MinuteStatus.Draft,
        createdByUserId: callerId
      },
      tx
    );

    return await buildMinuteResponseAsync(minute, [version]);
  });
}

export async function updatePendingVersion(
  callerId: number,
  minuteId: number,
  body: UpdateMinuteVersionRequest
): Promise<MinuteResponse | null> {
  await assertPermission(callerId, Module.Minutes, Action.Update);
  const minute = await repo.findMinuteById(minuteId);
  if (!minute) return null;

  const latest = await repo.findLatestVersion(minuteId);
  if (
    !latest ||
    (latest.status !== MinuteStatus.Draft && latest.status !== MinuteStatus.AwaitingApproval)
  )
    throw httpError(409, 'No pending version to update');

  const sanitized = sanitizeMinuteDoc(body.content);

  await repo.updateMinuteVersion(latest.id, { content: sanitized });
  const versions = await repo.getVersionsForMinute(minuteId);
  return buildMinuteResponseAsync(minute, versions);
}

export async function editApprovedMinute(
  callerId: number,
  minuteId: number,
  body: EditApprovedMinuteRequest
): Promise<MinuteResponse | null> {
  await assertPermission(callerId, Module.Minutes, Action.Update);
  const minute = await repo.findMinuteById(minuteId);
  if (!minute) return null;

  const latest = await repo.findLatestVersion(minuteId);
  if (!latest || latest.status !== MinuteStatus.Approved)
    throw httpError(409, 'Latest version must be approved to create a new one');

  const sanitized = sanitizeMinuteDoc(body.content);

  return await db.transaction(async (tx) => {
    await repo.updateMinuteVersion(latest.id, { status: MinuteStatus.Replaced }, tx);
    await repo.insertMinuteVersion(
      {
        minuteId,
        content: sanitized,
        version: latest.version + 1,
        status: MinuteStatus.AwaitingApproval,
        reasonForChange: body.reasonForChange,
        createdByUserId: callerId
      },
      tx
    );

    const versions = await repo.getVersionsForMinute(minuteId);
    return buildMinuteResponseAsync(minute, versions);
  });
}

export async function approveMinute(
  callerId: number,
  minuteId: number,
  body: ApproveMinuteRequest
): Promise<MinuteResponse | null> {
  await assertPermission(callerId, Module.Minutes, Action.Review);
  const minute = await repo.findMinuteById(minuteId);
  if (!minute) return null;

  const latest = await repo.findLatestVersion(minuteId);
  if (!latest || latest.status !== MinuteStatus.AwaitingApproval)
    throw httpError(409, 'No pending version to approve');

  await repo.updateMinuteVersion(latest.id, {
    status: MinuteStatus.Approved,
    approvedAtMeetingId: body.approvedAtMeetingId ?? null
  });

  const versions = await repo.getVersionsForMinute(minuteId);
  return buildMinuteResponseAsync(minute, versions);
}

export async function deleteMinute(callerId: number, minuteId: number): Promise<void | null> {
  await assertPermission(callerId, Module.Minutes, Action.Delete);
  const minute = await repo.findMinuteById(minuteId);
  if (!minute) return null;

  const versions = await repo.getVersionsForMinute(minuteId);
  if (versions.some((v) => v.status === MinuteStatus.Approved))
    throw httpError(409, 'Cannot delete a minute with an approved version');

  await repo.deleteMinute(minuteId);
}

export async function finalizeDraft(
  callerId: number,
  minuteId: number
): Promise<MinuteResponse | null> {
  await assertPermission(callerId, Module.Minutes, Action.Update);
  const minute = await repo.findMinuteById(minuteId);
  if (!minute) return null;

  const latest = await repo.findLatestVersion(minuteId);
  if (!latest || latest.status !== MinuteStatus.Draft)
    throw httpError(409, 'Latest version is not a draft');

  await repo.updateMinuteVersion(latest.id, { status: MinuteStatus.AwaitingApproval });
  const versions = await repo.getVersionsForMinute(minuteId);
  return buildMinuteResponseAsync(minute, versions);
}

export async function signMinute(
  callerId: number,
  minuteId: number,
  buffer: Buffer,
  mimetype: string
): Promise<MinuteResponse | null> {
  await assertPermission(callerId, Module.Minutes, Action.Update);
  const minute = await repo.findMinuteById(minuteId);
  if (!minute) return null;

  if (mimetype !== 'application/pdf') {
    throw httpError(400, 'Only PDF files are accepted');
  }

  const sniffed = await fileTypeFromBuffer(buffer);
  if (sniffed?.mime !== 'application/pdf') {
    throw httpError(400, 'Only PDF files are accepted');
  }

  const meeting = await repo.findMeetingById(minute.meetingId);
  if (!meeting) throw httpError(404, 'Board meeting not found');

  const dateObj = new Date(meeting.meetingDate);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const key = `signed-minutes/${year}/${month}/${randomUUID()}.pdf`;

  if (minute.signedDocumentPath) {
    try {
      await deleteFile(minute.signedDocumentPath);
    } catch {
      // ignore deletion errors
    }
  }

  await uploadFile(key, buffer, mimetype);
  await repo.updateMinute(minuteId, { signedDocumentPath: key });

  const updated = await repo.findMinuteById(minuteId);
  const versions = await repo.getVersionsForMinute(minuteId);
  return buildMinuteResponseAsync(updated!, versions);
}

export async function updateMinute(
  callerId: number,
  minuteId: number,
  body: UpdateMinuteRequest
): Promise<MinuteResponse | null> {
  await assertPermission(callerId, Module.Minutes, Action.Update);
  const minute = await repo.findMinuteById(minuteId);
  if (!minute) return null;

  const updateData: Partial<typeof body & { updatedAt?: Date }> = { ...body };
  await repo.updateMinute(minuteId, updateData as Parameters<typeof repo.updateMinute>[1]);

  const updated = await repo.findMinuteById(minuteId);
  const versions = await repo.getVersionsForMinute(minuteId);
  return buildMinuteResponseAsync(updated!, versions);
}

export async function renderMinutePdf(callerId: number, minuteId: number): Promise<Buffer | null> {
  await assertPermission(callerId, Module.Minutes, Action.View);
  const minute = await repo.findMinuteById(minuteId);
  if (!minute) return null;

  const meeting = await repo.findMeetingById(minute.meetingId);
  if (!meeting) throw httpError(404, 'Board meeting not found');

  const latest = await repo.findLatestVersion(minuteId);
  const churchSettings = await churchSettingsRepo.getChurchSettings();
  if (!churchSettings) throw httpError(409, 'Church settings not initialized');

  const previousMinuteNumber = await repo.getPreviousApprovedMinuteNumber();
  const attendersPresent = await repo.getMeetingAttendersPresent(minute.meetingId);

  const interpolatedContent = interpolateMinutePlaceholders(
    latest?.content ?? null,
    minute,
    { meetingDate: meeting.meetingDate ? new Date(meeting.meetingDate) : null, type: meeting.type },
    churchSettings,
    previousMinuteNumber,
    attendersPresent
  );

  return renderToBuffer(
    React.createElement(MinutePdf, {
      minute: {
        minuteNumber: minute.minuteNumber,
        presidingPastorName: minute.presidingPastorName ?? null,
        secretaryName: minute.secretaryName ?? null,
        openingTime: minute.openingTime ?? null,
        closingTime: minute.closingTime ?? null,
        boardMeeting: {
          meetingDate: meeting.meetingDate ? meeting.meetingDate.toString() : '',
          type: meeting.type
        }
      },
      versionContent: interpolatedContent,
      attendersPresent,
      church: {
        name: churchSettings.name,
        cnpj: churchSettings.cnpj,
        addressStreet: churchSettings.addressStreet,
        addressNumber: churchSettings.addressNumber,
        addressDistrict: churchSettings.addressDistrict,
        addressCity: churchSettings.addressCity,
        addressState: churchSettings.addressState
      }
    }) as React.ReactElement<DocumentProps>
  );
}

export async function getSuggestedMinuteNumber(callerId: number): Promise<string> {
  await assertPermission(callerId, Module.Minutes, Action.Create);
  const mostRecent = await repo.findMostRecentMinute();
  if (!mostRecent) return '';

  const match = mostRecent.minuteNumber.match(/(\d+)/);
  if (match && match[1]) {
    const num = parseInt(match[1], 10);
    return String(num + 1);
  }
  return '';
}

export async function getMeetingAttendersPresent(
  callerId: number,
  meetingId: number
): Promise<Array<{ id: number; name: string }>> {
  await assertPermission(callerId, Module.Minutes, Action.View);
  const meeting = await repo.findMeetingById(meetingId);
  if (!meeting) throw httpError(404, 'Board meeting not found');
  return repo.getMeetingAttendersPresent(meetingId);
}

export async function setMeetingAttendersPresent(
  callerId: number,
  meetingId: number,
  attenderIds: number[]
): Promise<void> {
  await assertPermission(callerId, Module.Minutes, Action.Update);
  const meeting = await repo.findMeetingById(meetingId);
  if (!meeting) throw httpError(404, 'Board meeting not found');
  return repo.setMeetingAttendersPresent(meetingId, attenderIds);
}

export async function listMinuteTemplates(): Promise<MinuteTemplateResponse[]> {
  await assertPermission(0, Module.MinuteTemplates, Action.View);
  const templates = await repo.listMinuteTemplates();
  return templates.map((t) => ({
    id: t.id,
    meetingType: t.meetingType,
    name: t.name,
    content: JSON.stringify(t.content),
    isDefault: t.isDefault,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString()
  }));
}

export async function getMinuteTemplateById(id: number): Promise<MinuteTemplateResponse | null> {
  const template = await repo.findMinuteTemplateById(id);
  if (!template) return null;
  return {
    id: template.id,
    meetingType: template.meetingType,
    name: template.name,
    content: JSON.stringify(template.content),
    isDefault: template.isDefault,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString()
  };
}

export async function updateMinuteTemplate(
  callerId: number,
  id: number,
  body: UpdateMinuteTemplateRequest
): Promise<MinuteTemplateResponse | null> {
  await assertPermission(callerId, Module.MinuteTemplates, Action.Update);

  let parsedContent: unknown = undefined;
  if (body.content) {
    try {
      parsedContent = JSON.parse(body.content);
    } catch {
      throw httpError(400, 'content must be valid JSON');
    }
  }

  return await db.transaction(async (tx) => {
    const template = await repo.findMinuteTemplateById(id);
    if (!template) return null;

    if (body.isDefault === true) {
      await tx
        .update(minuteTemplates)
        .set({ isDefault: false })
        .where(eq(minuteTemplates.meetingType, template.meetingType));
    }

    const updateData: Parameters<typeof repo.updateMinuteTemplate>[1] = {};
    if (body.name) updateData.name = body.name;
    if (parsedContent !== undefined) updateData.content = parsedContent;
    if (body.isDefault !== undefined) updateData.isDefault = body.isDefault;

    const updated = await repo.updateMinuteTemplate(id, updateData, tx);
    if (!updated) return null;

    return {
      id: updated.id,
      meetingType: updated.meetingType,
      name: updated.name,
      content: JSON.stringify(updated.content),
      isDefault: updated.isDefault,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString()
    };
  });
}
