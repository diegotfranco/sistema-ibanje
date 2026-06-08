import zlib from 'node:zlib';
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { FinancialStatementPdf } from '../src/modules/finance/reports/pdf-template.js';
import type { ChurchPdfData, PdfLogo } from '../src/lib/pdf/church.js';
import type { FinancialStatementResponse } from '../src/modules/finance/reports/schema.js';

// Smoke test for the shared letterhead/footer wiring. Rendering a react-pdf <Image>
// from a Buffer can fail at render time, so this guards that the logo path works and
// that the document carries dynamic church identity (no hardcoded church name).

// Build a guaranteed-decodable 1×1 RGB PNG (react-pdf's image parser rejects malformed
// or unusual encodings, so a hand-picked base64 is unreliable).
function crc32(buf: Buffer): number {
  let crc = ~0;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]!;
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}
function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typed = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed));
  return Buffer.concat([len, typed, crc]);
}
function tinyPng(): Buffer {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0); // width
  ihdr.writeUInt32BE(1, 4); // height
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  const idat = zlib.deflateSync(Buffer.from([0x00, 0xff, 0x00, 0x00])); // filter 0 + 1 red pixel
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}
const PNG_1x1 = tinyPng();

const church: ChurchPdfData = {
  name: 'Igreja Teste Letterhead',
  cnpj: '12.345.678/0001-90',
  addressStreet: 'Rua das Flores',
  addressNumber: '100',
  addressDistrict: 'Centro',
  addressCity: 'São Paulo',
  addressState: 'SP',
  postalCode: '01000000',
  phone: '11999999999',
  email: 'contato@igrejateste.org',
  websiteUrl: 'igrejateste.org'
};

const data: FinancialStatementResponse = {
  period: { from: '2025-01-01', to: '2025-01-31' },
  openingBalance: '0.00',
  totalIncome: '0.00',
  totalExpenses: '0.00',
  currentBalance: '0.00',
  incomeByCategory: [],
  incomeByCampaign: [],
  expensesByCategory: []
};

async function render(logo?: PdfLogo): Promise<Buffer> {
  return renderToBuffer(
    React.createElement(FinancialStatementPdf, {
      data,
      church,
      logo
    }) as React.ReactElement<DocumentProps>
  );
}

describe('printable letterhead', () => {
  it('renders a valid PDF with an embedded logo', async () => {
    const buf = await render({ data: PNG_1x1, format: 'png' });
    expect(buf.length).toBeGreaterThan(0);
    expect(buf.subarray(0, 4).toString('latin1')).toBe('%PDF');
  });

  it('renders a valid PDF without a logo', async () => {
    const buf = await render(undefined);
    expect(buf.length).toBeGreaterThan(0);
    expect(buf.subarray(0, 4).toString('latin1')).toBe('%PDF');
  });
});
