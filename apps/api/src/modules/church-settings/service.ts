import { randomUUID } from 'node:crypto';
import { fileTypeFromBuffer } from 'file-type';
import * as repo from './repository.js';
import { assertPermission } from '../../lib/permissions.js';
import { Module, Action } from '../../lib/constants.js';
import { httpError } from '../../lib/errors.js';
import { uploadFile, deleteFile, getFileStream, type StoredFile } from '../../lib/storage.js';
import type { UpdateChurchSettingsRequest, ChurchSettingsResponse } from './schema.js';

// Logos are embedded into letterheads, so restrict to raster images react-pdf can
// render — deliberately narrower than storage's shared ALLOWED_MIME_TYPES (which
// also permits PDF, valid for receipts but not for a logo).
const LOGO_MIME_TYPES: Record<string, 'png' | 'jpg'> = {
  'image/png': 'png',
  'image/jpeg': 'jpg'
};

type SettingsRow = NonNullable<Awaited<ReturnType<typeof repo.getChurchSettings>>>;

function toResponse(s: SettingsRow): ChurchSettingsResponse {
  return {
    id: s.id,
    name: s.name,
    cnpj: s.cnpj,
    addressStreet: s.addressStreet,
    addressNumber: s.addressNumber,
    addressDistrict: s.addressDistrict,
    addressCity: s.addressCity,
    addressState: s.addressState,
    postalCode: s.postalCode,
    phone: s.phone,
    email: s.email,
    websiteUrl: s.websiteUrl,
    logoPath: s.logoPath,
    currentPresidentName: s.currentPresidentName,
    currentPresidentTitle: s.currentPresidentTitle,
    currentSecretaryName: s.currentSecretaryName,
    currentSecretaryTitle: s.currentSecretaryTitle,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt
  };
}

export async function getChurchSettings(): Promise<ChurchSettingsResponse | null> {
  const settings = await repo.getChurchSettings();
  return settings ? toResponse(settings) : null;
}

export async function updateChurchSettings(
  callerId: number,
  body: UpdateChurchSettingsRequest
): Promise<ChurchSettingsResponse | null> {
  await assertPermission(callerId, Module.ChurchSettings, Action.Update);

  const updated = await repo.updateChurchSettings(body);
  return updated ? toResponse(updated) : null;
}

export async function uploadChurchLogo(
  callerId: number,
  buffer: Buffer,
  mimetype: string
): Promise<ChurchSettingsResponse> {
  await assertPermission(callerId, Module.ChurchSettings, Action.Update);

  const ext = LOGO_MIME_TYPES[mimetype];
  if (!ext) {
    throw httpError(400, 'Tipo de arquivo não suportado. Use PNG ou JPEG.', {
      fieldErrors: { file: 'Use uma imagem PNG ou JPEG.' }
    });
  }

  const sniffed = await fileTypeFromBuffer(buffer);
  if (sniffed?.mime !== mimetype) {
    throw httpError(400, 'O conteúdo do arquivo não corresponde ao tipo informado.', {
      fieldErrors: { file: 'O conteúdo do arquivo não corresponde ao tipo informado.' }
    });
  }

  const current = await repo.getChurchSettings();
  if (!current) throw httpError(409, 'Church settings not initialized');

  if (current.logoPath) await deleteFile(current.logoPath);

  const key = `logos/${randomUUID()}.${ext}`;
  await uploadFile(key, buffer, mimetype);

  const updated = await repo.updateChurchSettings({ logoPath: key });
  return toResponse(updated!);
}

export async function deleteChurchLogo(
  callerId: number
): Promise<'no_logo' | ChurchSettingsResponse> {
  await assertPermission(callerId, Module.ChurchSettings, Action.Update);

  const current = await repo.getChurchSettings();
  if (!current) throw httpError(409, 'Church settings not initialized');
  if (!current.logoPath) return 'no_logo';

  await deleteFile(current.logoPath);
  const updated = await repo.updateChurchSettings({ logoPath: null });
  return toResponse(updated!);
}

// No permission gate — mirrors GET /church-settings, which is open to any
// authenticated user (the logo is institutional branding, not sensitive data).
export async function getChurchLogoFile(): Promise<StoredFile | null> {
  const settings = await repo.getChurchSettings();
  if (!settings?.logoPath) return null;
  return getFileStream(settings.logoPath);
}
