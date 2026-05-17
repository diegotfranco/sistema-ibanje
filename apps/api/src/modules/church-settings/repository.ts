import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { churchSettings } from '../../db/schema.js';

const CHURCH_SETTINGS_COLUMNS = {
  id: churchSettings.id,
  name: churchSettings.name,
  cnpj: churchSettings.cnpj,
  addressStreet: churchSettings.addressStreet,
  addressNumber: churchSettings.addressNumber,
  addressDistrict: churchSettings.addressDistrict,
  addressCity: churchSettings.addressCity,
  addressState: churchSettings.addressState,
  postalCode: churchSettings.postalCode,
  phone: churchSettings.phone,
  email: churchSettings.email,
  websiteUrl: churchSettings.websiteUrl,
  logoPath: churchSettings.logoPath,
  currentPresidentName: churchSettings.currentPresidentName,
  currentPresidentTitle: churchSettings.currentPresidentTitle,
  currentSecretaryName: churchSettings.currentSecretaryName,
  currentSecretaryTitle: churchSettings.currentSecretaryTitle,
  createdAt: churchSettings.createdAt,
  updatedAt: churchSettings.updatedAt
};

export async function getChurchSettings() {
  const result = await db
    .select(CHURCH_SETTINGS_COLUMNS)
    .from(churchSettings)
    .where(eq(churchSettings.id, 1))
    .limit(1);

  return result[0] ?? null;
}

export async function updateChurchSettings(data: Partial<typeof churchSettings.$inferInsert>) {
  const result = await db
    .update(churchSettings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(churchSettings.id, 1))
    .returning(CHURCH_SETTINGS_COLUMNS);

  return result[0] ?? null;
}
