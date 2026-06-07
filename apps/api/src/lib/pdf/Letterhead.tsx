import { View, Text, Image } from '@react-pdf/renderer';
import { tw } from './theme.js';
import type { ChurchPdfData, PdfLogo } from './church.js';

function buildAddressLine(c: ChurchPdfData): string | null {
  const street = [c.addressStreet, c.addressNumber].filter(Boolean).join(', ');
  const cityState = c.addressCity
    ? c.addressState
      ? `${c.addressCity}/${c.addressState}`
      : c.addressCity
    : null;
  const line = [street, c.addressDistrict, cityState].filter(Boolean).join(' · ');
  return line || null;
}

function buildContactLine(c: ChurchPdfData): string | null {
  const line = [c.phone, c.email, c.websiteUrl].filter(Boolean).join(' · ');
  return line || null;
}

// Shared branded header for every printable. Lays out with full-width flex (no fixed
// page widths) so it renders correctly in both portrait and landscape orientations.
export function Letterhead({ church, logo }: { church: ChurchPdfData; logo?: PdfLogo }) {
  const address = buildAddressLine(church);
  const contact = buildContactLine(church);
  return (
    <View style={tw('flex-row items-center border-b border-gray-300 pb-3 mb-5')}>
      {logo ? (
        <Image src={logo} style={[tw('mr-3'), { width: 48, height: 48, objectFit: 'contain' }]} />
      ) : null}
      <View style={tw('flex-1')}>
        <Text style={tw('text-sm font-roboto font-bold text-brand-primary tracking-wide')}>
          {church.name}
        </Text>
        {address ? (
          <Text style={tw('text-[8px] font-roboto text-gray-600 mt-0.5')}>{address}</Text>
        ) : null}
        {contact ? <Text style={tw('text-[8px] font-roboto text-gray-600')}>{contact}</Text> : null}
        {church.cnpj ? (
          <Text style={tw('text-[8px] font-roboto text-gray-600')}>CNPJ: {church.cnpj}</Text>
        ) : null}
      </View>
    </View>
  );
}
