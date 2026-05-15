import * as repo from './repository.js';
import { assertPermission } from '../../lib/permissions.js';
import { Module, Action } from '../../lib/constants.js';
import type { UpdateChurchSettingsRequest, ChurchSettingsResponse } from './schema.js';

export async function getChurchSettings(): Promise<ChurchSettingsResponse | null> {
  const settings = await repo.getChurchSettings();
  if (!settings) return null;

  return {
    id: settings.id,
    name: settings.name,
    cnpj: settings.cnpj,
    addressStreet: settings.addressStreet,
    addressNumber: settings.addressNumber,
    addressDistrict: settings.addressDistrict,
    addressCity: settings.addressCity,
    addressState: settings.addressState,
    postalCode: settings.postalCode,
    phone: settings.phone,
    email: settings.email,
    websiteUrl: settings.websiteUrl,
    logoPath: settings.logoPath,
    currentPresidentName: settings.currentPresidentName,
    currentPresidentTitle: settings.currentPresidentTitle,
    currentSecretaryName: settings.currentSecretaryName,
    currentSecretaryTitle: settings.currentSecretaryTitle,
    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt
  };
}

export async function updateChurchSettings(
  callerId: number,
  body: UpdateChurchSettingsRequest
): Promise<ChurchSettingsResponse | null> {
  await assertPermission(callerId, Module.ChurchSettings, Action.Update);

  const updated = await repo.updateChurchSettings(body);
  if (!updated) return null;

  return {
    id: updated.id,
    name: updated.name,
    cnpj: updated.cnpj,
    addressStreet: updated.addressStreet,
    addressNumber: updated.addressNumber,
    addressDistrict: updated.addressDistrict,
    addressCity: updated.addressCity,
    addressState: updated.addressState,
    postalCode: updated.postalCode,
    phone: updated.phone,
    email: updated.email,
    websiteUrl: updated.websiteUrl,
    logoPath: updated.logoPath,
    currentPresidentName: updated.currentPresidentName,
    currentPresidentTitle: updated.currentPresidentTitle,
    currentSecretaryName: updated.currentSecretaryName,
    currentSecretaryTitle: updated.currentSecretaryTitle,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt
  };
}
