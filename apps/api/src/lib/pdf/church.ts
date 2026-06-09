import { getFileBuffer } from '../storage.js';

// The subset of church-settings fields a printable letterhead/footer needs.
export type ChurchPdfData = {
  name: string;
  cnpj: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressDistrict: string | null;
  addressCity: string | null;
  addressState: string | null;
  postalCode: string | null;
  phone: string | null;
  email: string | null;
  websiteUrl: string | null;
};

// @react-pdf/renderer's <Image> accepts a Buffer only via the { data, format } form.
export type PdfLogo = { data: Buffer; format: 'png' | 'jpg' };

// Structural shape accepted by toChurchPdfData — matches the church-settings row
// without coupling this lib to the module's exported types.
type ChurchSettingsLike = {
  name: string;
  cnpj?: string | null;
  addressStreet?: string | null;
  addressNumber?: string | null;
  addressDistrict?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  email?: string | null;
  websiteUrl?: string | null;
};

export function toChurchPdfData(s: ChurchSettingsLike): ChurchPdfData {
  return {
    name: s.name,
    cnpj: s.cnpj ?? null,
    addressStreet: s.addressStreet ?? null,
    addressNumber: s.addressNumber ?? null,
    addressDistrict: s.addressDistrict ?? null,
    addressCity: s.addressCity ?? null,
    addressState: s.addressState ?? null,
    postalCode: s.postalCode ?? null,
    phone: s.phone ?? null,
    email: s.email ?? null,
    websiteUrl: s.websiteUrl ?? null
  };
}

// Fetches the logo bytes for embedding into a PDF. Returns undefined when no logo
// is configured or the object is missing, so templates render gracefully without one.
export async function loadChurchLogo(
  logoPath: string | null | undefined
): Promise<PdfLogo | undefined> {
  if (!logoPath) return undefined;
  const data = await getFileBuffer(logoPath);
  if (!data) return undefined;
  const ext = logoPath.split('.').pop()?.toLowerCase();
  return { data, format: ext === 'png' ? 'png' : 'jpg' };
}
