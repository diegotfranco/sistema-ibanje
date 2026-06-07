import type { ReactNode } from 'react';
import { Page } from '@react-pdf/renderer';
import { tw } from './theme.js';
import { Letterhead } from './Letterhead.js';
import { PageFooter } from './PageFooter.js';
import type { ChurchPdfData, PdfLogo } from './church.js';

// Convenience wrapper for the common case: an A4 page with the shared letterhead at
// the top, the document body, and the fixed footer. Padding leaves room for the
// absolute footer. Templates with bespoke layouts (signature blocks, custom title
// rows) compose <Letterhead>/<PageFooter> directly instead.
export function PrintablePage({
  church,
  logo,
  orientation,
  children
}: {
  church: ChurchPdfData;
  logo?: PdfLogo;
  orientation?: 'portrait' | 'landscape';
  children: ReactNode;
}) {
  return (
    <Page
      size="A4"
      orientation={orientation}
      style={tw('font-roboto text-gray-900 px-8 pt-8 pb-14')}>
      <Letterhead church={church} logo={logo} />
      {children}
      <PageFooter churchName={church.name} />
    </Page>
  );
}
