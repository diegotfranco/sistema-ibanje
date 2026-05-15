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
  CreateMinuteTemplateRequest,
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
    // First pass: replace all placeholders
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    // Second pass: handle nested placeholders (e.g. placeholders inside {{pautas}})
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

function formatAgendaItems(
  agendaItems: Array<{ title: string; description: string | null }>
): string {
  if (agendaItems.length === 0) return '';
  return agendaItems
    .map((item, idx) => {
      const n = idx + 1;
      const desc = item.description?.trim();
      return desc ? `${n}) ${item.title} — ${desc}.` : `${n}) ${item.title}.`;
    })
    .join(' ');
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
  attendersPresent: Array<{ id: number; name: string }>,
  agendaItems: Array<{ title: string; description: string | null }>
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
    pautas: formatAgendaItems(agendaItems)
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
  attendersPresent: Array<{ id: number; name: string }>,
  agendaItems: Array<{ title: string; description: string | null }>
): unknown {
  const vars = buildInterpolationVariables(
    minute,
    meeting,
    church,
    previousMinuteNumber,
    attendersPresent,
    agendaItems
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
  const agendaItems = await repo.listAgendaItemsForMeeting(minute.meetingId);

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
    pautas: formatAgendaItems(agendaItems),
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
  const agendaItems = await repo.listAgendaItemsForMeeting(minute.meetingId);

  const interpolatedContent = interpolateMinutePlaceholders(
    latest?.content ?? null,
    minute,
    { meetingDate: meeting.meetingDate ? new Date(meeting.meetingDate) : null, type: meeting.type },
    churchSettings,
    previousMinuteNumber,
    attendersPresent,
    agendaItems
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
    content: t.content,
    isDefault: t.isDefault,
    defaultAgendaItems:
      (t.defaultAgendaItems as Array<{ title: string; description?: string | null }>) ?? [],
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
    content: template.content,
    isDefault: template.isDefault,
    defaultAgendaItems:
      (template.defaultAgendaItems as Array<{ title: string; description?: string | null }>) ?? [],
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString()
  };
}

export async function createMinuteTemplate(
  callerId: number,
  body: CreateMinuteTemplateRequest
): Promise<MinuteTemplateResponse> {
  await assertPermission(callerId, Module.MinuteTemplates, Action.Create);

  return await db.transaction(async (tx) => {
    if (body.isDefault) {
      await repo.clearDefaultForMeetingType(body.meetingType, tx);
    }

    const created = await repo.createMinuteTemplate(
      {
        meetingType: body.meetingType,
        name: body.name,
        content: body.content,
        isDefault: body.isDefault ?? false,
        defaultAgendaItems: body.defaultAgendaItems ?? [],
        createdByUserId: callerId
      },
      tx
    );

    return {
      id: created.id,
      meetingType: created.meetingType,
      name: created.name,
      content: created.content,
      isDefault: created.isDefault,
      defaultAgendaItems:
        (created.defaultAgendaItems as Array<{ title: string; description?: string | null }>) ?? [],
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString()
    };
  });
}

export async function updateMinuteTemplate(
  callerId: number,
  id: number,
  body: UpdateMinuteTemplateRequest
): Promise<MinuteTemplateResponse | null> {
  await assertPermission(callerId, Module.MinuteTemplates, Action.Update);

  return await db.transaction(async (tx) => {
    const template = await repo.findMinuteTemplateById(id);
    if (!template) return null;

    if (body.isDefault === true) {
      await repo.clearDefaultForMeetingType(template.meetingType, tx);
    }

    const updateData: Parameters<typeof repo.updateMinuteTemplate>[1] = {};
    if (body.name) updateData.name = body.name;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.isDefault !== undefined) updateData.isDefault = body.isDefault;
    if (body.defaultAgendaItems !== undefined)
      updateData.defaultAgendaItems = body.defaultAgendaItems;

    const updated = await repo.updateMinuteTemplate(id, updateData, tx);
    if (!updated) return null;

    return {
      id: updated.id,
      meetingType: updated.meetingType,
      name: updated.name,
      content: updated.content,
      isDefault: updated.isDefault,
      defaultAgendaItems:
        (updated.defaultAgendaItems as Array<{ title: string; description?: string | null }>) ?? [],
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString()
    };
  });
}

export async function deleteMinuteTemplate(callerId: number, id: number): Promise<void> {
  await assertPermission(callerId, Module.MinuteTemplates, Action.Delete);

  const template = await repo.findMinuteTemplateById(id);
  if (!template) throw httpError(404, 'Template not found');
  if (template.isDefault) throw httpError(409, 'Cannot delete default template — replace it first');

  await repo.deleteMinuteTemplate(id);
}
