import React from 'react';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import * as repo from './repository.js';
import { assertPermission } from '../../lib/permissions.js';
import { Module, Action } from '../../lib/constants.js';
import { httpError } from '../../lib/errors.js';
import * as churchSettingsRepo from '../church-settings/repository.js';
import { toChurchPdfData, loadChurchLogo } from '../../lib/pdf/church.js';
import { MinutePdf } from './pdf-template.js';
import type { Minute } from '../../db/schema.js';

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

export function formatAgendaItems(
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

function interpolateTemplate(template: unknown, variables: Record<string, string>): unknown {
  if (typeof template === 'string') {
    let result = template;
    // Two passes: placeholders inside the substituted {{pautas}} text (e.g. {{closing_time}})
    // still resolve.
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
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

interface ChurchInfo {
  name: string;
  cnpj: string;
  addressStreet: string;
  addressNumber: string;
  addressDistrict: string;
  addressCity: string;
  addressState: string;
}

function buildInterpolationVariables(
  minute: Minute,
  meeting: { meetingDate: Date | null; type: string },
  church: ChurchInfo,
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
  church: ChurchInfo,
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

  const logo = await loadChurchLogo(churchSettings.logoPath);

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
      church: toChurchPdfData(churchSettings),
      logo
    }) as React.ReactElement<DocumentProps>
  );
}
